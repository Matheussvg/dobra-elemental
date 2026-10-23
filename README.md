# Dobra Elemental

Jogo de dobra (Água, Terra, Fogo e Ar) inspirado em *Avatar: A Lenda de Aang*, em primeira ou terceira pessoa, com modo treino contra bonecos e arena online para até 8 jogadores.

Cada elemento tem a mesma escada de técnicas: três básicas (botão esquerdo, botão direito, E), duas especiais (Q, R) e uma ult (F), mais um movimento (C). A técnica de cada posição causa o mesmo dano em todos os elementos e a recarga vem da categoria; nenhuma técnica cura. O elemento é escolhido ao entrar e só muda depois de ser derrubado. Os valores ficam em `CAT` e `DMG` no início do script de `game.html`.

## Rodar localmente

```bash
npm install
npm run build   # gera public/index.html a partir de game.html
npm start       # http://localhost:10000
```

## Como o online funciona

`server.js` serve o jogo e mantém salas por WebSocket em `/ws` (máximo de 8 jogadores por sala). Cada jogador envia o próprio estado ~20 vezes por segundo e o servidor repassa para os outros da sala; cada navegador simula localmente as técnicas dos outros e decide o próprio dano.

## Deploy no Render

Web Service Node: build `npm install && npm run build`, start `npm start`. O plano gratuito dorme após 15 minutos sem acesso; o primeiro acesso depois disso demora cerca de 1 minuto.
