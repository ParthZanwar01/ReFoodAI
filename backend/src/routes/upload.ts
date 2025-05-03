import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { getDB } from '../db';
import { requireAuth } from './auth';
import { uploadService } from '../ai/services/uploadService';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// POST /api/upload (CSV file upload with AI validation)
router.post('/', requireAuth, upload.single('file'), async (req: any, res) => {
  const userId = req.user.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    const csv = req.file.buffer.toString('utf-8');
    
    // AI-powered categorization and validation
    const categorization = uploadService.categorizeCsv(csv);
    const validation = uploadService.validateCsv(csv, categorization.suggested_category);
    
    // If validation fails, return errors
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'CSV validation failed',
        validation_result: validation,
        categorization_result: categorization
      });
    }
    
    // Parse the CSV
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    
    // Generate insights
    const insights = uploadService.generateUploadInsights(csv, categorization.suggested_category);
    
    // Save to database with metadata
    const db = await getDB();
    await db.run(
      'INSERT INTO uploads (user_id, filename, data) VALUES (?, ?, ?)',
      [userId, req.file.originalname, JSON.stringify({
        records,
        metadata: {
          categorization,
          validation,
          insights,
          upload_timestamp: new Date().toISOString()
        }
      })]
    );
    
    res.json({ 
      success: true, 
      filename: req.file.originalname, 
      rows: records.length,
      categorization,
      validation,
      insights
    });
  } catch (e) {
    console.error('Upload error:', e);
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

// POST /api/upload/validate (validate CSV without uploading)
router.post('/validate', requireAuth, upload.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    const csv = req.file.buffer.toString('utf-8');
    
    // AI-powered categorization and validation
    const categorization = uploadService.categorizeCsv(csv);
    const validation = uploadService.validateCsv(csv, categorization.suggested_category);
    
    res.json({
      categorization,
      validation
    });
  } catch (e) {
    console.error('Validation error:', e);
    res.status(500).json({ error: 'Failed to validate file' });
  }
});

// GET /api/upload/supported-formats (get supported CSV formats)
router.get('/supported-formats', requireAuth, async (req: any, res) => {
  try {
    const formats = uploadService.getSupportedFormats();
    const format_details = formats.map(format => ({
      format,
      required_columns: uploadService.getRequiredColumns(format)
    }));
    
    res.json({ supported_formats: format_details });
  } catch (error) {
    console.error('Supported formats error:', error);
    res.status(500).json({ error: 'Failed to get supported formats' });
  }
});

// GET /api/upload/:id/insights (get insights for a specific upload)
router.get('/:id/insights', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const uploadId = req.params.id;
    
    const db = await getDB();
    const upload_record = await db.get(
      'SELECT data FROM uploads WHERE id = ? AND user_id = ?', 
      [uploadId, userId]
    );
    
    if (!upload_record) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    const upload_data = JSON.parse(upload_record.data);
    
    // Return stored insights or generate new ones
    if (upload_data.metadata && upload_data.metadata.insights) {
      res.json({ insights: upload_data.metadata.insights });
    } else {
      // For older uploads, return basic statistics
      const records = upload_data.records || upload_data;
      const insights = {
        data_summary: {
          total_records: Array.isArray(records) ? records.length : 0,
          columns: Array.isArray(records) && records.length > 0 ? Object.keys(records[0]).length : 0,
          completeness: 100
        },
        message: 'Legacy upload - detailed insights not available'
      };
      
      res.json({ insights });
    }
  } catch (error) {
    console.error('Upload insights error:', error);
    res.status(500).json({ error: 'Failed to get upload insights' });
  }
});

export default router; 