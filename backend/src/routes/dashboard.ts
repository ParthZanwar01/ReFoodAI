import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';

const router = express.Router();

// GET /api/dashboard
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  // Example: count uploads, pickups, and sum impact
  const uploads = await db.all('SELECT * FROM uploads WHERE user_id = ?', [userId]);
  const pickups = await db.all('SELECT * FROM pickups WHERE user_id = ?', [userId]);
  const impactRows = await db.all('SELECT * FROM impact WHERE user_id = ?', [userId]);
  let totalLbs = 0, totalCO2 = 0, totalMeals = 0;
  for (const row of impactRows) {
    try {
      const data = JSON.parse(row.data);
      totalLbs += data.lbs || 0;
      totalCO2 += data.co2 || 0;
      totalMeals += data.meals || 0;
    } catch {}
  }
  res.json({
    uploads: uploads.length,
    pickups: pickups.length,
    totalLbs,
    totalCO2,
    totalMeals,
  });
});

export default router; 