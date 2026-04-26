import { Hall } from '../models/Hall.js';
import { paginate } from '../utils/pagination.js';

// GET /api/halls?page=...
export const getHalls = async (req, res) => {
  try {
    const result = await paginate(
      Hall,
      req.query.page,
      req.query.limit,
      {},
      { sort: { name: 1 } }
    );
    res.json(result);
  } catch (error) {
    console.error('Fehler in getHalls:', error);
    res.status(500).json({ message: 'Fehler beim Laden der Säle' });
  }
};

// POST /api/halls
export const createHall = async (req, res) => {
  try {
    const { name, rows, seatsPerRow } = req.body;

    const r = parseInt(rows, 10);
    const s = parseInt(seatsPerRow, 10);

    if (
      !name ||
      isNaN(r) ||
      isNaN(s) ||
      r < 1 ||
      s < 1
    ) {
      return res.status(400).json({
        message: 'Name fehlt oder Anzahl der Reihen/Sitze ist ungültig (muss ganze Zahl ≥ 1 sein).'
      });
    }

    const newHall = new Hall({ name, rows: r, seatsPerRow: s });
    await newHall.save();

    res.status(201).json(newHall);
  } catch (error) {
    console.error('Fehler in createHall:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ error: 'InternalServerError', message: 'Fehler beim Anlegen des Saals' });
  }
};
