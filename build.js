// Wraps game.html (the page body, also published as a Claude artifact) into a full document at public/index.html.
const fs = require('fs');
const path = require('path');
const body = fs.readFileSync(path.join(__dirname, 'game.html'), 'utf8');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
</head>
<body>
${body}
</body>
</html>
`;
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
console.log('public/index.html gerado');
