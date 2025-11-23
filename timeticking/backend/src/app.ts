import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import socialsRoutes from './routes/socialRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/socials', socialsRoutes);
app.use('/api/focus', focusRoutes);

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
