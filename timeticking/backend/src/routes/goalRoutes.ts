import { Router } from 'express';
import { createGoal, deleteGoal, listGoals, updateGoal } from '../controllers/goalController.js';

const router = Router();

router.get('/', listGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
