# Kino-Verwaltung Web-Anwendung

Eine Full-Stack-Webanwendung zur Verwaltung eines Kinos, entwickelt im Rahmen der Lehrveranstaltung Web-Entwicklung (Wintersemester 2025/26).

## Über das Projekt

Diese Anwendung ermöglicht es Kinobetreibern und Kunden, Vorstellungen und Reservierungen zu verwalten. Das Frontend wird als statische Browser-Anwendung ausgeliefert, während das Backend eine REST-API bereitstellt und die Datenpersistierung übernimmt.

### Funktionalitäten

**Für Betreiber:**
- Kinosäle anlegen (Name, Anzahl Sitzreihen, Anzahl Sitze pro Reihe)
- Vorstellungen anlegen (Datum, Uhrzeit, Kinosaal, Filmname)

**Für Kunden:**
- Reservierung eines oder mehrerer freier Sitzplätze für eine Vorstellung
- QR-Code generieren als Bestätigung der Reservierung

**Allgemein:**
- Rollenauswahl (Betreiber / Kunde) auf der Startseite
- Paginierte Listen, die sich dynamisch an die Browserfenstergröße anpassen

## Technologien

| Bereich | Technologie |
|---------|-------------|
| Frontend | HTML, CSS (LESS), Vanilla JavaScript (ESM-Module) |
| Backend | Node.js, Express |
| Datenbank | MongoDB (Mongoose) |
| Build | esbuild (JS-Bundling), lessc (CSS), semistandard (Linting) |

## Projektstruktur

```
Kino/
├── client/
│   ├── index.html       # Einzige HTML-Datei
│   ├── script.js        # Gebündeltes JavaScript (via esbuild)
│   ├── style.css        # Kompiliertes CSS (via lessc)
│   └── style.less       # CSS-Quelldatei
├── server/
│   ├── server.js        # Express-Server Einstiegspunkt
│   ├── db.js            # MongoDB-Verbindung
│   ├── controllers/     # Routenlogik (Säle, Vorstellungen, Reservierungen)
│   ├── models/          # Mongoose-Modelle
│   ├── routes/          # Express-Router
│   └── utils/           # Paginierungs-Hilfsfunktionen
├── .env                 # Umgebungsvariablen (MongoDB-URI, Port)
└── package.json         # npm-Skripte und Abhängigkeiten
```

## Installation & Starten

### Voraussetzungen

- Node.js (aktuelle LTS-Version)
- MongoDB (lokal oder MongoDB Atlas URI)

### Anwendung starten

```bash
npm install && npm run build && npm start
```

Die Anwendung ist anschließend erreichbar unter **http://localhost:8080**

### Verfügbare npm-Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm install` | Alle Abhängigkeiten installieren |
| `npm run build` | CSS und JS für Produktion erstellen und minifizieren |
| `npm run debug` | Projekt ohne Minifizierung erstellen (Entwicklung) |
| `npm run lint` | Alle JS-Dateien mit semistandard prüfen |
| `npm run clean` | Alle generierten Dateien löschen |
| `npm start` | Server auf Port 8080 starten |

---

*Web-Entwicklung Hausarbeit – Wintersemester 2025/26*
