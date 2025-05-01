import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';

const router = express.Router();

router.post('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const input = req.body;
  await new Promise(r => setTimeout(r, 900));
  const result = {
    routes: [
      { from: 'Cafeteria', to: 'Food Bank', lbs: 120, cost: 15 },
      { from: 'Cafeteria', to: 'Compost Facility', lbs: 30, cost: 3 }
    ],
    partners: ['Food Bank', 'Compost Facility'],
    totalCost: 18,
    input,
  };
  const db = await getDB();
  await db.run(
    'INSERT INTO planners (user_id, input, result) VALUES (?, ?, ?)',
    [userId, JSON.stringify(input), JSON.stringify(result)]
  );
  res.json({ result });
});

router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const plans = await db.all('SELECT id, input, result, created_at FROM planners WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
  res.json({ plans });
});

export default router; 