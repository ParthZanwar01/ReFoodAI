import express from 'express';
import cors from 'cors';
import authRouter, { requireAuth } from './routes/auth';
import dashboardRouter from './routes/dashboard';
import uploadRouter from './routes/upload';
import forecastRouter from './routes/forecast';
import plannerRouter from './routes/planner';
import pickupsRouter from './routes/pickups';
import impactRouter from './routes/impact';
import settingsRouter from './routes/settings';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/pickups', pickupsRouter);
app.use('/api/impact', impactRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`ReFood backend running on http://localhost:${PORT}`);
}); 