import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mock endpoint for e-Jagriti & NCH Sync
router.post('/ejagriti', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { scanId, violations, productInfo } = req.body;
    
    if (!scanId) {
      return res.status(400).json({ error: 'scanId is required' });
    }

    console.log(`[SYNC] Sending non-compliance data to e-Jagriti portal for Scan ID: ${scanId}...`);
    
    // Simulate network delay to government portal
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate response
    const mockReferenceNumber = `EJAGRITI-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000)}`;

    console.log(`[SYNC SUCCESS] Data received by e-Jagriti. Ref: ${mockReferenceNumber}`);

    res.json({
      success: true,
      message: 'Successfully synchronized with e-Jagriti National Consumer Helpline.',
      referenceNumber: mockReferenceNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to sync with e-Jagriti', error);
    res.status(500).json({ error: 'Failed to communicate with e-Jagriti portal' });
  }
});

export default router;
