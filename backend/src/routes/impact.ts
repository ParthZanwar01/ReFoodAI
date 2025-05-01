import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';

const router = express.Router();

router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const impact = await db.all('SELECT * FROM impact WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  res.json({ impact });
});

router.post('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { data } = req.body;
  const db = await getDB();
  await db.run(
    'INSERT INTO impact (user_id, data) VALUES (?, ?)',
    [userId, JSON.stringify(data)]
  );
  res.json({ success: true });
});

export default router; 