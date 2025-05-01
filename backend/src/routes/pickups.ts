import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';

const router = express.Router();

// GET /api/pickups (list all pickups)
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const pickups = await db.all('SELECT * FROM pickups WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
  res.json({ pickups });
});

// POST /api/pickups (create new pickup)
router.post('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { status = 'Scheduled', details = '{}' } = req.body;
  const db = await getDB();
  await db.run(
    'INSERT INTO pickups (user_id, status, details) VALUES (?, ?, ?)',
    [userId, status, JSON.stringify(details)]
  );
  res.json({ success: true });
});

// PATCH /api/pickups/:id (update pickup status/details)
router.patch('/:id', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { status, details } = req.body;
  const db = await getDB();
  await db.run(
    'UPDATE pickups SET status = ?, details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [status, JSON.stringify(details), id, userId]
  );
  res.json({ success: true });
});

export default router; 