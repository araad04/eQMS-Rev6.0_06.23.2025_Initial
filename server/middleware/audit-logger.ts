
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export async function auditLog(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    const userId = (req as any).user?.id;
    
    if (req.method !== 'GET' && userId) { // Log only mutations
      // Temporarily log to console instead of database
      console.log('[AUDIT]', {
        userId: userId,
        action: req.method,
        entityType: req.path.split('/')[2] || 'unknown',
        entityId: parseInt(req.params.id) || 0,
        details: `${req.method} ${req.path} completed in ${responseTime}ms with status ${res.statusCode}`,
        timestamp: new Date()
      });
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
}
