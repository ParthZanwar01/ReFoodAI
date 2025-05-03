import express from 'express';
import { getDB } from '../db';
import { requireAuth } from './auth';
import { dashboardService } from '../ai/services/dashboardService';

const router = express.Router();

// GET /api/dashboard (comprehensive dashboard overview)
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const db = await getDB();
    
    // Get basic user-specific data
    const uploads = await db.all('SELECT * FROM uploads WHERE user_id = ?', [userId]);
    const pickups = await db.all('SELECT * FROM pickups WHERE user_id = ?', [userId]);
    const impactRows = await db.all('SELECT * FROM impact WHERE user_id = ?', [userId]);
    
    // Get AI-powered dashboard overview
    const aiOverview = await dashboardService.getDashboardOverview();
    
    // Combine user data with AI insights
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
      // Basic user stats
      user_stats: {
        uploads: uploads.length,
        pickups: pickups.length,
        totalLbs,
        totalCO2,
        totalMeals,
      },
      // AI-powered overview
      ai_overview: aiOverview
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// GET /api/dashboard/performance (performance metrics)
router.get('/performance', requireAuth, async (req: any, res) => {
  try {
    const performance = await dashboardService.getPerformanceMetrics();
    res.json({ performance });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// GET /api/dashboard/top-items (top items analysis)
router.get('/top-items', requireAuth, async (req: any, res) => {
  try {
    const topItems = await dashboardService.getTopItemsAnalysis();
    res.json({ topItems });
  } catch (error) {
    console.error('Top items analysis error:', error);
    res.status(500).json({ error: 'Failed to get top items analysis' });
  }
});

// GET /api/dashboard/system-status (comprehensive system status)
router.get('/system-status', requireAuth, async (req: any, res) => {
  try {
    const systemStatus = await dashboardService.getSystemStatus();
    res.json({ systemStatus });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

export default router; 