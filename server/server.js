'use strict';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import hallsRouter from './routes/hallsRouter.js';
import screeningsRouter from './routes/screeningsRouter.js';
import reservationsRouter from './routes/reservationsRouter.js';

// __dirname für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.argv[2] || 8080;

// JSON-Body parser
app.use(express.json());

// Statische Dateien aus dist
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/halls', hallsRouter);
app.use('/api/screenings', screeningsRouter);
app.use('/api/reservations', reservationsRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Server STARTET ERST NACH erfolgreicher DB-Verbindung
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Verbindung fehlgeschlagen:', err);
    process.exit(1);
  });
