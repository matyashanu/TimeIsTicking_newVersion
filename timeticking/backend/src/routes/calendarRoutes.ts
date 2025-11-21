import { Router } from 'express';
import {
  addEvent,
  deleteEvent,
  editEvent,
  listEvents,
  parseCsvImport,
  parseIcsImport,
  updateEvent,
} from '../controllers/calendarController.js';

const router = Router();

router.get('/events', listEvents);

router.post('/import/csv', parseCsvImport);
router.post('/import/ics', parseIcsImport);
router.post('/import/ical', parseIcsImport); // alias for backwards compatibility
router.post('/add', addEvent);
router.post('/edit', editEvent);
router.put('/events/:id', updateEvent);
router.patch('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

export default router;
