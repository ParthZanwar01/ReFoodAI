import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';
import { plannerService, PlannerInput } from '../ai/services/plannerService';

const router = express.Router();

// POST /api/planner (optimize menu)
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const input: PlannerInput = req.body;
    
    // Validate required fields
    if (!input.date || !input.estimated_students || !input.target_categories || input.target_categories.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: date, estimated_students, target_categories' 
      });
    }

    // Run menu optimization
    const result = await plannerService.optimizeMenu(input);
    
    // Save to database
    const db = await getDB();
    await db.run(
      'INSERT INTO planners (user_id, input, result) VALUES (?, ?, ?)',
      [userId, JSON.stringify(input), JSON.stringify(result)]
    );
    
    res.json({ result });
  } catch (error) {
    console.error('Menu optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize menu' });
  }
});

// GET /api/planner (list previous menu plans)
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const plans = await db.all('SELECT id, input, result, created_at FROM planners WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
  res.json({ plans });
});

// GET /api/planner/suggestions (get menu suggestions with constraints)
router.get('/suggestions', requireAuth, async (req: any, res) => {
  try {
    const constraints = {
      max_prep_time: req.query.max_prep_time ? parseInt(req.query.max_prep_time as string) : undefined,
      dietary_restrictions: req.query.dietary_restrictions ? (req.query.dietary_restrictions as string).split(',') : undefined,
      cost_limit: req.query.cost_limit ? parseFloat(req.query.cost_limit as string) : undefined
    };
    
    const suggestions = plannerService.getMenuSuggestions(constraints);
    res.json({ suggestions });
  } catch (error) {
    console.error('Menu suggestions error:', error);
    res.status(500).json({ error: 'Failed to get menu suggestions' });
  }
});

// GET /api/planner/category-insights (get category performance insights)
router.get('/category-insights', requireAuth, async (req: any, res) => {
  try {
    const insights = plannerService.getCategoryInsights();
    res.json({ insights });
  } catch (error) {
    console.error('Category insights error:', error);
    res.status(500).json({ error: 'Failed to get category insights' });
  }
});

export default router; 