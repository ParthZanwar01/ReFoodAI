import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';

const router = express.Router();

// POST /api/forecast (run prediction)
router.post('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const input = req.body;
  // Simulate delay
  await new Promise(r => setTimeout(r, 800));
  // Fake prediction result
  const result = {
    prediction: Math.round(Math.random() * 100),
    shap: [0.2, -0.1, 0.3, 0.05],
    chart: [10, 20, 30, 40],
    features: input.features || [],
  };
  const db = await getDB();
  await db.run(
    'INSERT INTO forecasts (user_id, input, result) VALUES (?, ?, ?)',
    [userId, JSON.stringify(input), JSON.stringify(result)]
  );
  res.json({ result });
});

// GET /api/forecast (list forecasts)
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const forecasts = await db.all('SELECT id, input, result, created_at FROM forecasts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
  res.json({ forecasts });
});

export default router; 