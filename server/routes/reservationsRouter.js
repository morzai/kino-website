
import { Router } from 'express';
import { createReservation } from '../controllers/reservationsController.js';

const router = Router();

// POST /api/reservations
router.post('/', createReservation);

export default router;
