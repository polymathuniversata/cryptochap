/**
 * Performance monitoring utilities for CryptoChap
 * Tracks response times, errors, and system metrics
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000;

  /**
   * Track the execution time of an async operation
   */
  static async trackAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: true,
        metadata
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      });

      throw error;
    }
  }

  /**
   * Track the execution time of a sync operation
   */
  static trackSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = Date.now();

    try {
      const result = fn();
      const duration = Date.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: true,
        metadata
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      });

      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private static recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    if (metric.duration > 5000) {
      console.warn(`Slow operation detected: ${metric.operation} took ${metric.duration}ms`, {
        operation: metric.operation,
        duration: metric.duration,
        success: metric.success,
        error: metric.error,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(operation?: string): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    slowestOperation: PerformanceMetrics | null;
  } {
    const relevantMetrics = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        slowestOperation: null
      };
    }

    const successful = relevantMetrics.filter(m => m.success);
    const failed = relevantMetrics.filter(m => !m.success);
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);

    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const medianDuration = durations[Math.floor(durations.length / 2)];
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Duration = durations[p95Index] || durations[durations.length - 1];

    const slowestOperation = relevantMetrics.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );

    return {
      totalOperations: relevantMetrics.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration: Math.round(averageDuration),
      medianDuration,
      p95Duration,
      slowestOperation
    };
  }

  /**
   * Get recent metrics
   */
  static getRecentMetrics(limit: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get error rate for an operation
   */
  static getErrorRate(operation?: string): number {
    const relevantMetrics = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const failedCount = relevantMetrics.filter(m => !m.success).length;
    return (failedCount / relevantMetrics.length) * 100;
  }

  /**
   * Get operations summary
   */
  static getOperationsSummary(): Record<string, {
    count: number;
    avgDuration: number;
    errorRate: number;
  }> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];

    const summary: Record<string, any> = {};

    for (const operation of operations) {
      const stats = this.getStats(operation);
      summary[operation] = {
        count: stats.totalOperations,
        avgDuration: stats.averageDuration,
        errorRate: this.getErrorRate(operation)
      };
    }

    return summary;
  }
}

/**
 * Response time tracker for HTTP requests
 */
export class ResponseTimeTracker {
  private static activeRequests = new Map<string, number>();

  static start(requestId: string): void {
    this.activeRequests.set(requestId, Date.now());
  }

  static end(requestId: string, operation: string, metadata?: Record<string, any>): void {
    const startTime = this.activeRequests.get(requestId);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.activeRequests.delete(requestId);

    PerformanceMonitor.trackSync(
      operation,
      () => {
        // This is just to record the metric
        return true;
      },
      {
        ...metadata,
        requestId,
        duration
      }
    );
  }

  static getActiveRequestCount(): number {
    return this.activeRequests.size;
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    // In Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const used = memUsage.heapUsed;
      const total = memUsage.heapTotal;
      const percentage = (used / total) * 100;

      return {
        used: Math.round(used / 1024 / 1024), // MB
        total: Math.round(total / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100
      };
    }

    // Browser environment
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memUsage = (performance as any).memory;
      const used = memUsage.usedJSHeapSize;
      const total = memUsage.totalJSHeapSize;
      const percentage = (used / total) * 100;

      return {
        used: Math.round(used / 1024 / 1024), // MB
        total: Math.round(total / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100
      };
    }

    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  static logMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    console.log(`Memory Usage: ${usage.used}MB / ${usage.total}MB (${usage.percentage}%)`);
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor;
export const responseTimeTracker = ResponseTimeTracker;
export const memoryMonitor = MemoryMonitor;