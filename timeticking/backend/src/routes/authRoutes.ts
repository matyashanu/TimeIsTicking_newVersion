import { Router } from 'express';
import { signup, verifyEmail, login } from '../controllers/authController.js';

const router = Router();

router.post('/signup', signup);
router.get('/verify-email', verifyEmail);
router.post('/login', login);

export default router;
