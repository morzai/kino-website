import { Screening } from '../models/Screening.js';
import { Hall } from '../models/Hall.js';
import { paginate } from '../utils/pagination.js';

// GET /api/screenings?page=...&onlyFuture=true
export const getScreenings = async (req, res) => {
  try {
    const onlyFuture = req.query.onlyFuture === 'true';

    const filter = {};
    if (onlyFuture) {
      filter.start = { $gte: new Date() };
    }

    const result = await paginate(
      Screening,
      req.query.page,
      req.query.limit,
      filter,
      {
        sort: { start: 1 },
        populate: { path: 'hall', select: 'name' } // damit hallName gesetzt werden kann
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Fehler in getScreenings:', error);
    res.status(500).json({ error: 'InternalServerError', message: 'Fehler beim Laden der Vorstellungen' });
  }
};

// POST /api/screenings
export const createScreening = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'BadRequest', message: 'Request body fehlt (JSON senden!)' });
    }

    const { start, movie, hallId } = req.body;

    if (!start || !movie || !hallId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'start, movie und hallId sind erforderlich'
      });
    }

    // hall muss existieren
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'hallId verweist auf keine existierende Halle'
      });
    }

    const date = new Date(start);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'start muss ein gültiger ISO-Datumstring sein'
      });
    }

    const screening = new Screening({
      start: date,
      movie,
      hall: hallId
    });

    await screening.save();

    // Antwort soll hallName enthalten -> populate für die Response
    await screening.populate({ path: 'hall', select: 'name' });

    res.status(201).json(screening);
  } catch (error) {
    console.error('Fehler in createScreening:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'ValidationError', message: error.message });
    }

    res.status(500).json({ error: 'InternalServerError', message: 'Fehler beim Anlegen der Vorstellung' });
  }
};
