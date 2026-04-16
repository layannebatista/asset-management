import { Request, Response, NextFunction } from 'express';
/**
 * Simple API key authentication for service-to-service calls.
 * The backend and frontend proxy requests through the Spring Boot API
 * which adds the X-AI-Service-Key header.
 */
export declare function requireApiKey(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map