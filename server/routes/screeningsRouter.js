import { Router } from 'express';
import { getScreenings, createScreening } from '../controllers/screeningsController.js';
import { getReservationsByScreening } from '../controllers/reservationsController.js';

const router = Router();

// /api/screenings
router.get('/', getScreenings);
router.post('/', createScreening);

// /api/screenings/:id/reservations
router.get('/:id/reservations', getReservationsByScreening);

export default router;
