import { Router } from 'express';
import { getGoals } from '../controllers/goalController.js';

const router = Router();

router.get('/', getGoals);

export default router;
