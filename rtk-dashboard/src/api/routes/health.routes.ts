import fs from 'fs';
import { Router, Request, Response } from 'express';
import { config } from '../../config';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'rtk-dashboard',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  res.json({
    ready: fs.existsSync(config.rtk.historyDbPath),
    historyDbPath: config.rtk.historyDbPath,
  });
});

export default router;
