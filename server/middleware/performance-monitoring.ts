/**
 * Performance Monitoring Middleware
 * IEC 62304 Section 5.7 - Software System Testing
 * Performance requirement: API responses < 2 seconds under normal load
 */

import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: Date;
  userId?: number;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
}

interface PerformanceThresholds {
  warning: number;
  critical: number;
  timeout: number;
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  warning: 1000,   // 1 second warning
  critical: 2000,  // 2 second critical (regulatory requirement)
  timeout: 5000    // 5 second timeout
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance violations
    if (metric.responseTime > PERFORMANCE_THRESHOLDS.critical) {
      console.error('🚨 CRITICAL: API response time exceeded regulatory limit', {
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        threshold: PERFORMANCE_THRESHOLDS.critical,
        userId: metric.userId
      });
    } else if (metric.responseTime > PERFORMANCE_THRESHOLDS.warning) {
      console.warn('⚠️ WARNING: API response time approaching limit', {
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        threshold: PERFORMANCE_THRESHOLDS.warning
      });
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const total = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return Math.round(total / filteredMetrics.length);
  }

  getSlowEndpoints(threshold: number = PERFORMANCE_THRESHOLDS.warning): string[] {
    const endpointTimes = new Map<string, number[]>();
    
    this.metrics.forEach(metric => {
      if (!endpointTimes.has(metric.endpoint)) {
        endpointTimes.set(metric.endpoint, []);
      }
      endpointTimes.get(metric.endpoint)!.push(metric.responseTime);
    });

    const slowEndpoints: string[] = [];
    endpointTimes.forEach((times, endpoint) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (avgTime > threshold) {
        slowEndpoints.push(endpoint);
      }
    });

    return slowEndpoints;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware for regulatory compliance
 * Tracks response times and memory usage per API endpoint
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Set timeout for regulatory compliance
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('🚨 TIMEOUT: API request exceeded maximum allowed time', {
        endpoint: req.path,
        method: req.method,
        timeout: PERFORMANCE_THRESHOLDS.timeout,
        userId: req.user?.id
      });
      
      res.status(504).json({
        error: 'Request timeout',
        message: 'API response time exceeded regulatory limits',
        code: 'PERFORMANCE_TIMEOUT'
      });
    }
  }, PERFORMANCE_THRESHOLDS.timeout);

  res.on('finish', () => {
    clearTimeout(timeout);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endMemory = process.memoryUsage();

    const metric: PerformanceMetrics = {
      endpoint: req.path,
      method: req.method,
      responseTime,
      timestamp: new Date(),
      userId: req.user?.id,
      statusCode: res.statusCode,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };

    performanceMonitor.recordMetric(metric);

    // Add performance headers for monitoring
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Memory-Delta', `${metric.memoryUsage.heapUsed} bytes`);
  });

  next();
}

/**
 * Database query performance optimization
 */
export class QueryOptimizer {
  private static queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static async executeWithCache<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(cacheKey);
    const now = Date.now();

    // Return cached result if valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      console.log(`📋 Cache hit: ${cacheKey}`);
      return cached.result;
    }

    // Execute query and cache result
    console.log(`🔍 Cache miss: ${cacheKey} - executing query`);
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const queryTime = Date.now() - startTime;
      
      // Cache the result
      this.queryCache.set(cacheKey, {
        result,
        timestamp: now,
        ttl
      });

      console.log(`✅ Query completed: ${cacheKey} (${queryTime}ms)`);
      return result;
    } catch (error) {
      console.error(`❌ Query failed: ${cacheKey}`, error);
      throw error;
    }
  }

  static clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.queryCache.keys())
        .filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.queryCache.delete(key));
      console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching: ${pattern}`);
    } else {
      this.queryCache.clear();
      console.log('🗑️ Cleared all cache entries');
    }
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys())
    };
  }
}

/**
 * Connection pool optimization for database performance
 */
export function optimizeDatabaseConnections() {
  return {
    // Optimal pool settings for eQMS performance
    poolSize: process.env.NODE_ENV === 'production' ? 20 : 5,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 30000,
    maxLifetimeSeconds: 3600,
    
    // Performance monitoring
    onConnect: () => {
      console.log('📊 Database connection established');
    },
    onError: (error: Error) => {
      console.error('🚨 Database connection error:', error);
    }
  };
}