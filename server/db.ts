import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Even more conservative pool settings to prevent rate limiting
const MAX_POOL_SIZE = 5; // Further reduced pool size to prevent rate limiting
const IDLE_TIMEOUT = 60000; // Longer idle timeout to reduce reconnection frequency
const CONNECTION_TIMEOUT = 15000; // Longer connection timeout
const CONNECTION_RETRY_DELAY = 5000; // Initial retry delay

// Exponential backoff configuration
const MAX_RETRIES = 5;
const RETRY_BASE_DELAY = 1000;
const MAX_RETRY_DELAY = 30000; // Maximum 30s between retries

// Create connection pool with rate-limit-friendly settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: MAX_POOL_SIZE,
  idleTimeoutMillis: IDLE_TIMEOUT,
  connectionTimeoutMillis: CONNECTION_TIMEOUT,
  ssl: true
});

// Handle unexpected errors on the pool
pool.on('error', async (err) => {
  console.error('Unexpected database pool error:', err);
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection restored');
      break;
    } catch (error) {
      retries++;
      const delay = Math.min(CONNECTION_RETRY_DELAY * Math.pow(2, retries), MAX_RETRY_DELAY);
      console.error(`Retry ${retries} failed, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
});

// Create drizzle instance with the pool
export const db = drizzle(pool, { schema });

// Enhanced query executor with exponential backoff for rate limit handling
export async function executeQuery(query: string, params: any[] = [], maxRetries = MAX_RETRIES) {
  let retries = 0;
  
  while (true) {
    try {
      return await pool.query(query, params);
    } catch (error: unknown) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is a rate limit error
      const isRateLimitError = errorMessage.includes("rate limit") || 
                              errorMessage.includes("too many connections");
      
      // Calculate backoff time with exponential increase and jitter
      const exponentialDelay = Math.min(
        MAX_RETRY_DELAY,
        RETRY_BASE_DELAY * Math.pow(2, retries) + Math.random() * 1000
      );
      
      // Use longer delays for rate limit errors
      const delayMs = isRateLimitError ? exponentialDelay : RETRY_BASE_DELAY;
      
      console.error(
        `Query error (retry ${retries+1}/${maxRetries}): ${errorMessage}. ` +
        `${isRateLimitError ? "Rate limit detected. " : ""}` +
        `Retrying in ${(delayMs/1000).toFixed(1)}s...`
      );
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}



// Initialize database with better error handling
export async function initializeDatabase() {
  console.log("Initializing database...");
  
  try {
    // Test connection and create tables if needed
    const result = await executeQuery('SELECT 1 as connection_test');
    console.log("Database connection successful:", result.rows[0]);
    
    // Create required tables
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Database initialization completed with table creation");
    return true;
  } catch (error) {
    console.error("Error connecting to database:", error);
    console.log("Continuing application startup despite database error");
    // Don't throw the error to allow application to start even with database issues
    return false;
  }
}