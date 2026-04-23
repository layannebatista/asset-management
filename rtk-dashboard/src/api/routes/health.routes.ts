import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'ai-intelligence',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  // Could add DB connectivity check here
  res.json({ ready: true });
});

export default router;
