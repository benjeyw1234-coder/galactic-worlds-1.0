// Galactic Worlds – Online-Server
// Liefert public/index.html aus und verteilt per WebSocket die Spielerpositionen
// an alle anderen Spieler im selben Raum ("Welt"). Ohne Raumcode: öffentliche Welt "welt".
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const MAX_PER_ROOM = +process.env.MAX_PER_ROOM || 40;
const MAX_MSG = 2048;            // Bytes pro Nachricht
const MAX_MSG_PER_SEC = 30;      // Schutz vor Spam
const HTML_PATH = path.join(__dirname, 'public', 'index.html');

// Spiel einmal laden und gzip-komprimieren (10 MB -> deutlich kleiner)
let html = fs.readFileSync(HTML_PATH);
let htmlGz = zlib.gzipSync(html, { level: 9 });
let etag = '"' + require('crypto').createHash('md5').update(html).digest('hex') + '"';
if (process.env.DEV) fs.watchFile(HTML_PATH, () => {
  html = fs.readFileSync(HTML_PATH); htmlGz = zlib.gzipSync(html);
  etag = '"' + require('crypto').createHash('md5').update(html).digest('hex') + '"';
});

const isNums = (a, n) => Array.isArray(a) && a.length === n && a.every(Number.isFinite);
function valid(m) {
  if (!m || m.t !== 'p' || typeof m.i !== 'string' || m.i.length > 16 || !Number.isFinite(m.q)) return false;
  if (!isNums(m.sp, 3) || !isNums(m.sq, 4)) return false;
  if (m.w && (!isNums(m.mp, 3) || !isNums(m.mq, 4))) return false;
  return true;
}

const rooms = new Map(); // name -> Set<ws>
const roomOf = (name) => { let r = rooms.get(name); if (!r) rooms.set(name, r = new Set()); return r; };
const total = () => { let n = 0; for (const r of rooms.values()) n += r.size; return n; };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (url.pathname === '/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify({ online: total(), rooms: rooms.size }));
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const h = { 'content-type': 'text/html; charset=utf-8', etag, 'cache-control': 'no-cache', vary: 'accept-encoding' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { h['content-encoding'] = 'gzip'; res.writeHead(200, h); return res.end(htmlGz); }
    res.writeHead(200, h); return res.end(html);
  }
  res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Nicht gefunden');
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MSG });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://x');
  const name = (url.searchParams.get('room') || 'welt').toLowerCase().replace(/[^a-z0-9äöüß_-]/g, '').slice(0, 24) || 'welt';
  const room = roomOf(name);
  if (room.size >= MAX_PER_ROOM) { ws.close(4001, 'Welt voll'); return; }
  room.add(ws);
  ws.isAlive = true; ws.room = name; ws.win = Date.now(); ws.cnt = 0;
  ws.send(JSON.stringify({ t: 'hello', room: name, n: room.size }));
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    const now = Date.now();
    if (now - ws.win > 1000) { ws.win = now; ws.cnt = 0; }
    if (++ws.cnt > MAX_MSG_PER_SEC) return;
    const raw = data.toString();
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!valid(m)) return; // nur gültige Positions-Updates weiterreichen
    for (const c of room) if (c !== ws && c.readyState === 1) c.send(raw);
  });
  ws.on('close', () => { room.delete(ws); if (!room.size) rooms.delete(name); });
  ws.on('error', () => {});
});

// Tote Verbindungen aufräumen (hält Verbindungen auch hinter Proxys offen)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; try { ws.ping(); } catch (e) {}
  }
}, 25000);

server.listen(PORT, () => console.log('Galactic Worlds läuft auf Port ' + PORT));
