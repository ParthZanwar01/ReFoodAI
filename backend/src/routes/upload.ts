import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { getDB } from '../db';
import { requireAuth } from './auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// POST /api/upload (CSV file upload)
router.post('/', requireAuth, upload.single('file'), async (req: any, res) => {
  const userId = req.user.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const csv = req.file.buffer.toString('utf-8');
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    const db = await getDB();
    await db.run(
      'INSERT INTO uploads (user_id, filename, data) VALUES (?, ?, ?)',
      [userId, req.file.originalname, JSON.stringify(records)]
    );
    res.json({ success: true, filename: req.file.originalname, rows: records.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse or store file' });
  }
});

// GET /api/upload (list uploads)
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const db = await getDB();
  const uploads = await db.all('SELECT id, filename, uploaded_at FROM uploads WHERE user_id = ?', [userId]);
  res.json({ uploads });
});

export default router; 