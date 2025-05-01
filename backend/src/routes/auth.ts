import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../db';

const JWT_SECRET = 'supersecretkey';
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, org } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const db = await getDB();
  const hashed = await bcrypt.hash(password, 10);
  try {
    await db.run('INSERT INTO users (email, password, org) VALUES (?, ?, ?)', [email, hashed, org || null]);
    return res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'User already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const db = await getDB();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user: { id: user.id, email: user.email, org: user.org } });
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export default router; 