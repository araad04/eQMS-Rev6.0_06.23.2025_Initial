import { pool } from '../db';
import { Logger } from './logger';

/**
 * Database health check utility - verifies connection is working properly
 * Returns both connection state and detailed table status to ensure data availability
 * Important for regulated environments (21 CFR Part 11, ISO 13485) 
 */
export async function checkDatabaseHealth() {
  try {
    // Test basic connectivity
    const client = await pool.connect();
    
    try {
      // Check if we can execute a simple query
      await client.query('SELECT NOW()');
      
      // Get table stats
      const tableStatsQuery = `
        SELECT 
          t.relname as table_name,
          t.n_live_tup as row_count,
          pg_size_pretty(pg_table_size(c.oid)) as table_size
        FROM pg_stat_user_tables t
        JOIN pg_class c ON c.relname = t.relname
        ORDER BY t.n_live_tup DESC
      `;
      
      const tableStats = await client.query(tableStatsQuery);
      
      return {
        connected: true,
        timestamp: new Date().toISOString(),
        message: 'Database connection successful',
        stats: {
          tables: tableStats.rows,
          tableCount: tableStats.rowCount
        }
      };
    } catch (error) {
      Logger.error(`Database health check query error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        connected: false,
        timestamp: new Date().toISOString(),
        message: 'Database connection established but query failed',
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      client.release();
    }
  } catch (error) {
    Logger.error(`Database connection error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}