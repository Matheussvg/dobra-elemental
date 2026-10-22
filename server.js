// Dobra Elemental — static file server + WebSocket rooms for the online arena.
// Each player sends their own state ("presence") ~20x per second; the server relays it
// to everyone else in the same room. Clients simulate each other's techniques locally.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 10000;
const PUB = path.join(__dirname, 'public');
const MAX_PLAYERS = 8;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  if (p === '/healthz') { res.writeHead(200); return res.end('ok'); }
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
const rooms = new Map(); // room name -> Map(peer -> socket)
let counter = 1;
const newPeer = () => Math.random().toString(36).slice(2, 10) + (counter++).toString(36);

function broadcast(room, msg, except) {
  if (!room) return;
  const s = JSON.stringify(msg);
  for (const c of room.values()) if (c !== except && c.readyState === 1) c.send(s);
}

wss.on('connection', (ws) => {
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (buf) => {
    let m;
    try { m = JSON.parse(buf); } catch { return; }
    if (!m || typeof m !== 'object') return;

    if (m.t === 'join' && !ws.room) {
      const name = String(m.room || 'vale').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'vale';
      let room = rooms.get(name);
      if (!room) { room = new Map(); rooms.set(name, room); }
      if (room.size >= MAX_PLAYERS) { ws.send(JSON.stringify({ t: 'full' })); return ws.close(); }
      ws.peer = newPeer(); ws.room = name; ws.pres = {};
      ws.send(JSON.stringify({ t: 'welcome', peer: ws.peer, peers: [...room.values()].map(c => ({ peer: c.peer, presence: c.pres })) }));
      room.set(ws.peer, ws);
      broadcast(room, { t: 'join', peer: ws.peer }, ws);
      return;
    }

    if (m.t === 'p' && ws.room && m.d && typeof m.d === 'object' && !Array.isArray(m.d)) {
      const now = Date.now();
      if (now - (ws.lastP || 0) < 20) return; // at most ~50 updates/s per player
      ws.lastP = now;
      ws.pres = m.d;
      broadcast(rooms.get(ws.room), { t: 'p', peer: ws.peer, d: m.d }, ws);
    }
  });
  ws.on('close', () => {
    if (!ws.room) return;
    const room = rooms.get(ws.room);
    if (!room) return;
    room.delete(ws.peer);
    broadcast(room, { t: 'left', peer: ws.peer });
    if (!room.size) rooms.delete(ws.room);
  });
});

// drop dead connections (and keep proxies from idling the socket out)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false;
    ws.ping();
  }
}, 25000);

server.listen(PORT, () => console.log(`Dobra Elemental rodando na porta ${PORT}`));
