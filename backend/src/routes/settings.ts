import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';

const router = express.Router();

router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const row = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId]);
  res.json({ settings: row ? JSON.parse(row.data) : {} });
});

router.post('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { data } = req.body;
  const db = await getDB();
  const row = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId]);
  if (row) {
    await db.run('UPDATE settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [JSON.stringify(data), userId]);
  } else {
    await db.run('INSERT INTO settings (user_id, data) VALUES (?, ?)', [userId, JSON.stringify(data)]);
  }
  res.json({ success: true });
});

export default router; 