import express from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const RULES_PATH = path.join(__dirname, '../config/lmpc-rules.json');

// GET /api/rules
router.get('/', authenticateToken, (req: AuthRequest, res: express.Response) => {
  try {
    const rawData = fs.readFileSync(RULES_PATH, 'utf-8');
    res.json(JSON.parse(rawData));
  } catch (error) {
    console.error('Failed to read rules', error);
    res.status(500).json({ error: 'Failed to read rules configuration' });
  }
});

// PUT /api/rules
router.put('/', authenticateToken, (req: AuthRequest, res: express.Response) => {
  // Only admins should modify rules
  if (req.user?.role !== 'admin' && req.user?.role !== 'supervisor') {
    return res.status(403).json({ error: 'Unauthorized to modify rules' });
  }

  try {
    const newRules = req.body;
    // Basic validation
    if (!newRules || !newRules.rules || !newRules.categories) {
      return res.status(400).json({ error: 'Invalid rule schema' });
    }

    fs.writeFileSync(RULES_PATH, JSON.stringify(newRules, null, 2), 'utf-8');
    res.json({ success: true, message: 'Rules updated successfully' });
  } catch (error) {
    console.error('Failed to save rules', error);
    res.status(500).json({ error: 'Failed to save rules configuration' });
  }
});

export default router;
