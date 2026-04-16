import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';

/**
 * Simple API key authentication for service-to-service calls.
 * The backend and frontend proxy requests through the Spring Boot API
 * which adds the X-AI-Service-Key header.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-ai-service-key'] as string | undefined;

  if (!key || key !== config.service.apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid X-AI-Service-Key header required',
    });
    return;
  }

  next();
}
