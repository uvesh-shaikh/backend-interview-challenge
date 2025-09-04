import { Router, Request, Response } from 'express';
import { SyncService } from '../services/syncService';

const router = Router();
const syncService = new SyncService();

// POST /api/sync - Trigger sync operation
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Starting sync operation...');
    const result = await syncService.processSync();
    
    console.log('Sync completed:', result);
    
    if (result.failed > 0) {
      res.status(207).json({
        message: 'Sync completed with some failures',
        ...result
      });
    } else {
      res.json({
        message: 'Sync completed successfully',
        ...result
      });
    }
  } catch (error) {
    console.error('Error during sync operation:', error);
    res.status(500).json({
      error: 'Internal server error during sync operation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/sync/status - Get sync status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await syncService.getSyncStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      error: 'Internal server error while fetching sync status'
    });
  }
});

// POST /api/sync/retry - Retry failed sync operations
router.post('/retry', async (req: Request, res: Response) => {
  try {
    await syncService.retryFailedOperations();
    
    res.json({
      message: 'Failed operations have been reset for retry'
    });
  } catch (error) {
    console.error('Error retrying failed operations:', error);
    res.status(500).json({
      error: 'Internal server error while retrying failed operations'
    });
  }
});

// DELETE /api/sync/failed - Clear all failed sync operations
router.delete('/failed', async (req: Request, res: Response) => {
  try {
    await syncService.clearFailedOperations();
    
    res.json({
      message: 'Failed sync operations have been cleared'
    });
  } catch (error) {
    console.error('Error clearing failed operations:', error);
    res.status(500).json({
      error: 'Internal server error while clearing failed operations'
    });
  }
});

export default router;