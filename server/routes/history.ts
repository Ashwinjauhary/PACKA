import express from 'express';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res: express.Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM scans WHERE user_id = ? ORDER BY timestamp DESC');
    const rows = stmt.all(req.user.id) as any[];

    const scans = rows.map(row => JSON.parse(row.details_json));
    res.json(scans);
  } catch (error) {
    res.status(500).json({ error: 'Database error fetching history' });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res: express.Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM scans WHERE id = ? AND user_id = ?');
    const row = stmt.get(req.params.id, req.user.id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json(JSON.parse(row.details_json));
  } catch (error) {
    res.status(500).json({ error: 'Database error fetching scan' });
  }
});

export default router;
