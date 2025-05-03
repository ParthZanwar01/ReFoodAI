import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';
import { impactService, ImpactProjectionInput } from '../ai/services/impactService';

const router = express.Router();

// GET /api/impact (get historical impact records)
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const impact = await db.all('SELECT * FROM impact WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  res.json({ impact });
});

// POST /api/impact (save new impact data)
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

// POST /api/impact/calculate (calculate impact projections)
router.post('/calculate', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const input: ImpactProjectionInput = req.body;
    
    // Validate required fields
    if (!input.projection_period) {
      return res.status(400).json({ 
        error: 'Missing required field: projection_period (week, month, quarter, or year)' 
      });
    }

    // Calculate impact projections
    const result = await impactService.calculateImpact(input);
    
    // Save calculation to database
    const db = await getDB();
    await db.run(
      'INSERT INTO impact (user_id, data) VALUES (?, ?)',
      [userId, JSON.stringify({ calculation_input: input, calculation_result: result })]
    );
    
    res.json({ result });
  } catch (error) {
    console.error('Impact calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate impact projections' });
  }
});

// GET /api/impact/comparison (get historical comparison)
router.get('/comparison', requireAuth, async (req: any, res) => {
  try {
    const periods = req.query.periods ? (req.query.periods as string).split(',') : ['2024-01', '2024-02', '2024-03'];
    const comparison = impactService.getHistoricalComparison(periods);
    res.json({ comparison });
  } catch (error) {
    console.error('Impact comparison error:', error);
    res.status(500).json({ error: 'Failed to get impact comparison' });
  }
});

// GET /api/impact/top-metrics (get top impact metrics)
router.get('/top-metrics', requireAuth, async (req: any, res) => {
  try {
    const metrics = impactService.getTopImpactMetrics();
    res.json({ metrics });
  } catch (error) {
    console.error('Top metrics error:', error);
    res.status(500).json({ error: 'Failed to get top impact metrics' });
  }
});

// GET /api/impact/benchmark (get benchmark comparison)
router.get('/benchmark', requireAuth, async (req: any, res) => {
  try {
    const benchmark = impactService.getBenchmarkComparison();
    res.json({ benchmark });
  } catch (error) {
    console.error('Benchmark comparison error:', error);
    res.status(500).json({ error: 'Failed to get benchmark comparison' });
  }
});

export default router; 