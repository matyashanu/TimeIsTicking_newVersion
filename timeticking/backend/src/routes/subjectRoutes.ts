import { Router } from 'express';
import { createSubject, deleteSubject, listSubjects, updateSubject } from '../controllers/subjectController.js';

const router = Router();

router.get('/', listSubjects);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.patch('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
