import { Router } from 'express';
import { getHalls, createHall } from '../controllers/hallsController.js';

const router = Router();

// GET /api/halls?page=1
// Liefert eine paginierte Liste aller Säle
router.get('/', getHalls);

// POST /api/halls
// Legt einen neuen Saal an
router.post('/', createHall);

export default router;
