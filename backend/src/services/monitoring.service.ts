import { logger } from './logging.service';

/**
 * Monitoring and metrics service
 * Provides comprehensive application monitoring and performance tracking
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, number> = new Map();
  private startTime: number = Date.now();

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Start monitoring intervals
   */
  private startMonitoring(): void {
    // Log memory usage every 30 seconds
    setInterval(() => {
      this.logMemoryUsage();
    }, 30000);

    // Log performance metrics every 60 seconds
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 60000);
  }

  /**
   * Log memory usage statistics
   */
  private logMemoryUsage(): void {
    const memUsage = process.memoryUsage();

    const memoryStats = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
    };

    logger.info('Memory usage statistics', memoryStats);

    // Alert if memory usage is high
    if (memoryStats.heapUsed > 500) { // 500MB threshold
      logger.warn('High memory usage detected', {
        ...memoryStats,
        warning: 'Memory usage exceeds 500MB'
      });
    }
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(): void {
    const uptime = Math.round(process.uptime()); // seconds
    const uptimeFormatted = {
      days: Math.floor(uptime / 86400),
      hours: Math.floor((uptime % 86400) / 3600),
      minutes: Math.floor((uptime % 3600) / 60),
      seconds: uptime % 60
    };

    const performanceStats = {
      uptime: uptimeFormatted,
      uptimeSeconds: uptime,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuUsage: process.cpuUsage(),
      pid: process.pid
    };

    logger.info('Application performance metrics', performanceStats);
  }

  /**
   * Increment a metric counter
   */
  public incrementMetric(key: string, value: number = 1): void {
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
  }

  /**
   * Set a metric value
   */
  public setMetric(key: string, value: number): void {
    this.metrics.set(key, value);
  }

  /**
   * Get a metric value
   */
  public getMetric(key: string): number {
    return this.metrics.get(key) || 0;
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Track API endpoint performance
   */
  public trackApiCall(endpoint: string, method: string, duration: number, statusCode: number): void {
    this.incrementMetric(`api.${method}.${endpoint}.calls`);
    this.incrementMetric(`api.${method}.${endpoint}.total_duration`, duration);

    if (statusCode >= 200 && statusCode < 300) {
      this.incrementMetric(`api.${method}.${endpoint}.success`);
    } else if (statusCode >= 400 && statusCode < 500) {
      this.incrementMetric(`api.${method}.${endpoint}.client_error`);
    } else if (statusCode >= 500) {
      this.incrementMetric(`api.${method}.${endpoint}.server_error`);
    }

    // Log slow queries (over 1 second)
    if (duration > 1000) {
      logger.warn('Slow API call detected', {
        endpoint,
        method,
        duration: `${duration}ms`,
        statusCode,
        threshold: '1000ms'
      });
    }
  }

  /**
   * Track database query performance
   */
  public trackDbQuery(operation: string, duration: number, success: boolean): void {
    this.incrementMetric(`db.${operation}.calls`);
    this.incrementMetric(`db.${operation}.total_duration`, duration);

    if (success) {
      this.incrementMetric(`db.${operation}.success`);
    } else {
      this.incrementMetric(`db.${operation}.error`);
    }

    // Log slow database operations (over 500ms)
    if (duration > 500) {
      logger.warn('Slow database operation detected', {
        operation,
        duration: `${duration}ms`,
        success,
        threshold: '500ms'
      });
    }
  }

  /**
   * Track WhatsApp message processing
   */
  public trackWhatsAppMessage(phoneNumber: string, direction: 'inbound' | 'outbound', success: boolean): void {
    this.incrementMetric(`whatsapp.${direction}.messages`);

    if (success) {
      this.incrementMetric(`whatsapp.${direction}.success`);
    } else {
      this.incrementMetric(`whatsapp.${direction}.failed`);
    }

    // Track unique users
    this.setMetric(`whatsapp.unique_users`, this.getMetric('whatsapp.unique_users') + 1);
  }

  /**
   * Track blockchain transactions
   */
  public trackBlockchainTransaction(txHash: string, network: string, success: boolean): void {
    this.incrementMetric(`blockchain.${network}.transactions`);

    if (success) {
      this.incrementMetric(`blockchain.${network}.success`);
    } else {
      this.incrementMetric(`blockchain.${network}.failed`);
    }
  }

  /**
   * Track error rates
   */
  public trackError(errorCode: string, endpoint?: string): void {
    this.incrementMetric('errors.total');

    if (endpoint) {
      this.incrementMetric(`errors.${endpoint}.${errorCode}`);
    } else {
      this.incrementMetric(`errors.${errorCode}`);
    }
  }

  /**
   * Get health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memoryUsage: any;
    metrics: Record<string, number>;
    timestamp: string;
  } {
    const memUsage = process.memoryUsage();
    const memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    };

    // Determine health status based on metrics
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (memoryUsage.heapUsed > 800) { // 800MB threshold
      status = 'degraded';
    }

    if (memoryUsage.heapUsed > 1000 || this.getMetric('errors.total') > 100) { // 1GB or 100+ errors
      status = 'unhealthy';
    }

    return {
      status,
      uptime: Math.round(process.uptime()),
      memoryUsage,
      metrics: this.getAllMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset metrics (for testing)
   */
  public resetMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get monitoring summary
   */
  public getSummary(): {
    uptime: string;
    memoryUsage: any;
    totalApiCalls: number;
    totalErrors: number;
    totalDbOperations: number;
    totalWhatsAppMessages: number;
    totalBlockchainTransactions: number;
    healthStatus: string;
  } {
    const uptime = Math.round(process.uptime());
    const uptimeFormatted = {
      days: Math.floor(uptime / 86400),
      hours: Math.floor((uptime % 86400) / 3600),
      minutes: Math.floor((uptime % 3600) / 60),
      seconds: uptime % 60
    };

    const memUsage = process.memoryUsage();

    return {
      uptime: `${uptimeFormatted.days}d ${uptimeFormatted.hours}h ${uptimeFormatted.minutes}m ${uptimeFormatted.seconds}s`,
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      },
      totalApiCalls: this.getMetric('api.total_calls') || 0,
      totalErrors: this.getMetric('errors.total') || 0,
      totalDbOperations: this.getMetric('db.total_calls') || 0,
      totalWhatsAppMessages: this.getMetric('whatsapp.inbound.messages') + this.getMetric('whatsapp.outbound.messages'),
      totalBlockchainTransactions: Object.keys(this.getAllMetrics())
        .filter(key => key.startsWith('blockchain.') && key.includes('.transactions'))
        .reduce((sum, key) => sum + this.getMetric(key), 0),
      healthStatus: this.getHealthStatus().status
    };
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();
