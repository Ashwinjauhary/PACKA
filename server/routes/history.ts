import express from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scans WHERE user_id = $1 ORDER BY timestamp DESC',
      [req.user.id]
    );

    const scans = result.rows.map(row => {
      // details_json is JSONB, so PostgreSQL returns it as an object already
      return typeof row.details_json === 'string' ? JSON.parse(row.details_json) : row.details_json;
    });
    res.json(scans);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Database error fetching history' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const row = result.rows[0];
    const data = typeof row.details_json === 'string' ? JSON.parse(row.details_json) : row.details_json;
    res.json(data);
  } catch (error) {
    console.error('Scan fetch error:', error);
    res.status(500).json({ error: 'Database error fetching scan' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM scans WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Scan not found or unauthorized' });
    }

    res.json({ message: 'Scan deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Scan delete error:', error);
    res.status(500).json({ error: 'Database error deleting scan' });
  }
});

export default router;
