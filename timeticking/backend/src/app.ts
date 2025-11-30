import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import socialsRoutes from './routes/socialRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';

const app = express();

app.use(cors());
// Increase body size limits to reduce 413 errors for larger payloads/files
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/socials', socialsRoutes);
app.use('/api/focus', focusRoutes);

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/subjects', subjectRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
