import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';
import { trackerService, PickupOptimizationInput } from '../ai/services/trackerService';

const router = express.Router();

// GET /api/pickups (list all pickups)
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const rawPickups = await db.all('SELECT * FROM pickups WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
  
  // Parse JSON details field for each pickup
  const pickups = rawPickups.map(pickup => ({
    ...pickup,
    details: pickup.details ? JSON.parse(pickup.details) : {}
  }));
  
  res.json(pickups);
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

// POST /api/pickups/optimize (optimize pickup routes and scheduling)
router.post('/optimize', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const input: PickupOptimizationInput = req.body;
    
    // Validate required fields
    if (!input.date || !input.available_locations || input.available_locations.length === 0 || 
        !input.available_drivers || input.available_drivers.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: date, available_locations, available_drivers' 
      });
    }

    // Run pickup optimization
    const result = await trackerService.optimizePickups(input);
    
    // Save optimization results to database
    const db = await getDB();
    await db.run(
      'INSERT INTO pickups (user_id, status, details) VALUES (?, ?, ?)',
      [userId, 'Optimized', JSON.stringify({ optimization_input: input, optimization_result: result })]
    );
    
    res.json({ result });
  } catch (error) {
    console.error('Pickup optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize pickups' });
  }
});

// GET /api/pickups/location-insights/:location (get insights for specific location)
router.get('/location-insights/:location', requireAuth, async (req: any, res) => {
  try {
    const location = decodeURIComponent(req.params.location);
    const insights = trackerService.getLocationInsights(location);
    
    if (insights.error) {
      return res.status(404).json(insights);
    }
    
    res.json({ insights });
  } catch (error) {
    console.error('Location insights error:', error);
    res.status(500).json({ error: 'Failed to get location insights' });
  }
});

// GET /api/pickups/system-performance (get overall pickup system performance)
router.get('/system-performance', requireAuth, async (req: any, res) => {
  try {
    const performance = trackerService.getSystemPerformance();
    res.json({ performance });
  } catch (error) {
    console.error('System performance error:', error);
    res.status(500).json({ error: 'Failed to get system performance metrics' });
  }
});

export default router; 