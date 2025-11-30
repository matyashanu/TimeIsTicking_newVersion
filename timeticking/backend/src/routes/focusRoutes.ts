import express from 'express';
import requireUser from '../middleware/auth.js';
import { startFocus, stopFocus, getLeaderboard } from '../controllers/focusController.js';

const router = express.Router();

router.post('/start', requireUser, startFocus);
router.post('/stop', requireUser, stopFocus);
router.get('/leaderboard', requireUser, getLeaderboard);

export default router;
