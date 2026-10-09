# Galactic Worlds – Online

Eine gemeinsame Welt für alle: Jeder, der die Webadresse öffnet und „🌐 Online spielen" klickt,
fliegt im selben Universum und sieht die anderen Piloten.

## Inhalt
- `public/index.html` – dein Spiel (mit neuem Hauptmenü und Online-Anbindung)
- `server.js` – liefert das Spiel aus und verteilt die Positionen der Spieler (WebSocket)
- `package.json`, `Dockerfile`, `render.yaml` – für das Hosting

## 1) Lokal testen (2 Minuten)
```
npm install
npm start
```
Dann `http://localhost:3000` in zwei Browser-Fenstern öffnen, beide auf „Online spielen".

## 2) Für alle ins Internet stellen (kostenlos mit Render)
1. Lege auf github.com ein neues Repository an und lade den **gesamten Ordner** hoch (inkl. `public/`).
2. Gehe auf render.com → *New* → *Web Service* → dein Repository wählen.
   (Mit `render.yaml` wird alles automatisch ausgefüllt. Sonst: Build `npm install`, Start `node server.js`.)
3. Nach ca. 2 Minuten bekommst du eine Adresse wie `https://galactic-worlds-xyz.onrender.com`.
4. Diese Adresse schickst du deinen Freunden – fertig. Im Spiel gibt es dafür den Knopf **„🔗 Einladungslink kopieren"**.

Hinweis: Der kostenlose Render-Plan schläft nach ~15 Minuten ohne Besucher ein; der erste Aufruf danach
dauert etwa eine Minute. Bezahlpläne (oder Railway, Fly.io, ein eigener Server) haben das nicht.
Der Server läuft überall, wo Node.js ≥ 18 oder Docker läuft; er nutzt die Umgebungsvariable `PORT`.

## So spielen Freunde mit
- **Öffentliche Welt:** Adresse öffnen → „Online spielen". Alle landen in derselben Welt.
- **Private Welt nur mit Freunden:** Im Menü unter „⚙ Raum & Server" einen Raumcode eintragen (z. B. `ben-und-co`)
  und den Einladungslink kopieren. Der Link enthält `?room=ben-und-co`, wer ihn öffnet, landet im selben Raum.
- Im Spiel öffnet der Knopf **👥** das Mehrspieler-Menü (Name, Raum, Verbinden/Trennen, Einladungslink, Hauptmenü).
  🟢 = verbunden, 🟠 = verbindet gerade / Verbindung verloren (verbindet sich automatisch neu).

## Spiel getrennt vom Server hosten (optional)
Liegt `index.html` woanders (z. B. GitHub Pages), trägt man im Menü unter „Server-Adresse" die Serveradresse ein
(z. B. `galactic-worlds-xyz.onrender.com`). Sie wird im Browser gemerkt.

## Grenzen
- Synchronisiert werden Schiffe und Spieler zu Fuß (Position, Drehung, Triebwerk, Fahrwerk). Fortschritt, Inventar,
  Landeplätze und Credits bleiben pro Spieler lokal im Browser gespeichert.
- Pro Raum max. 40 Spieler (`MAX_PER_ROOM`). Der Server prüft Nachrichten und begrenzt Spam.
- Wer den Tab im Hintergrund hat, wird für die anderen nach wenigen Sekunden ausgeblendet und erscheint wieder, sobald er zurückkehrt.
