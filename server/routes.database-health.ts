import { Router } from 'express';
import { checkDatabaseHealth } from './utils/database-health-check';
import { Logger } from './utils/logger';

export const databaseHealthRouter = Router();

/**
 * Database health check endpoint
 * Used for monitoring database connectivity and table status
 * Important for regulatory compliance with 21 CFR Part 11
 */
databaseHealthRouter.get('/database-health', async (req, res) => {
  try {
    Logger.info('Database health check endpoint hit');
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      status: dbHealth.connected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    Logger.error(`Database health check error: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Failed to perform database health check',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});