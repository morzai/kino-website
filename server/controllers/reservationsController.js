import {
  Reservation
} from '../models/Reservation.js';
import {
  Screening
} from '../models/Screening.js';

const SEAT_RE = /^[A-Z]+\d{1,2}$/; // mind. 1 Ziffer, max 2 (für 99 Sitze pro Reihe)

// GET /api/screenings/:id/reservations
// Lädt alle Reservierungen für eine bestimmte Vorstellung
export const getReservationsByScreening = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    // Validierung, ob Screening existiert (nicht zwingend, aber sauber)
    const screening = await Screening.findById(id).select('_id').lean();
    if (!screening) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Vorstellung existiert nicht'
      });
    }

    const reservations = await Reservation.find({
      screening: id
    });
    res.json(reservations);
  } catch (error) {
    console.error('Fehler in getReservationsByScreening:', error);

    // z.B. ungültige ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Ungültige Vorstellung-ID'
      });
    }

    res.status(500).json({
      error: 'InternalServerError',
      message: 'Fehler beim Laden der Reservierungen'
    });
  }
};

// POST /api/reservations
export const createReservation = async (req, res) => {
  try {
    // 1) Body vorhanden?
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Request body fehlt oder ist leer (JSON senden!)'
      });
    }

    const {
      screeningId,
      customerName,
      seatLabels
    } = req.body;

    // 2) Grundvalidierung
    if (!screeningId || !customerName || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'screeningId, customerName und seatLabels (Array mit mind. 1 Sitz) sind erforderlich'
      });
    }

    // 3) seatLabels Format prüfen (A1, B12, AA3 ...)
    const invalidSeatLabels = seatLabels.filter(s =>
      typeof s !== 'string' || s.trim() === '' || !SEAT_RE.test(s.trim())
    );

    if (invalidSeatLabels.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'seatLabels müssen Strings im Format "A1" sein',
        invalidSeatLabels
      });
    }

    // 4) Existenz-Check: Vorstellung vorhanden?
    const screening = await Screening.findById(screeningId).select('_id').lean();
    if (!screening) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Die angegebene Vorstellung existiert nicht.'
      });
    }

    // 5) Konfliktprüfung (DB macht die Arbeit)
    const conflictingReservations = await Reservation.find({
      screening: screeningId,
      seatLabels: {
        $in: seatLabels
      }
    }).select('seatLabels').lean();

    if (conflictingReservations.length > 0) {
      const takenSeats = conflictingReservations.flatMap((r) => r.seatLabels);
      const conflicts = [...new Set(seatLabels.filter((s) => takenSeats.includes(s)))];

      return res.status(409).json({
        error: 'SeatUnavailable',
        message: 'Ein oder mehrere Sitze sind bereits reserviert.',
        conflictingSeats: conflicts
      });
    }

    // 6) Speichern
    const newReservation = new Reservation({
      screening: screeningId, // DB-Feld
      customerName: customerName.trim(),
      seatLabels
    });

    await newReservation.save();

    // Rückgabe im Vertragformat passiert über Reservation.toJSON
    res.status(201).json(newReservation);
  } catch (error) {
    console.error('Fehler in createReservation:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Ungültige screeningId'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'ValidationError',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'InternalServerError',
      message: 'Fehler beim Erstellen der Reservierung'
    });
  }
};
