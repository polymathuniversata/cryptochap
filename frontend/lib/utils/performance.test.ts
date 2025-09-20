/**
 * Performance Monitoring Tests
 * Tests for performance tracking, metrics collection, and monitoring utilities
 */

/// <reference types="jest" />

import {
  PerformanceMonitor,
  ResponseTimeTracker,
  MemoryMonitor
} from '../utils/performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  describe('trackAsync', () => {
    test('tracks successful async operations', async () => {
      const result = await PerformanceMonitor.trackAsync(
        'testOperation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'success';
        }
      );

      expect(result).toBe('success');

      const stats = PerformanceMonitor.getStats('testOperation');
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(1);
      expect(stats.failedOperations).toBe(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    test('tracks failed async operations', async () => {
      let errorThrown = false;

      try {
        await PerformanceMonitor.trackAsync(
          'testOperation',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
            throw new Error('Test error');
          }
        );
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Test error');
      }

      expect(errorThrown).toBe(true);

      const stats = PerformanceMonitor.getStats('testOperation');
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(0);
      expect(stats.failedOperations).toBe(1);
    });

    test('includes metadata in tracking', async () => {
      const metadata = { userId: '123', action: 'test' };

      await PerformanceMonitor.trackAsync(
        'testOperation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return 'success';
        },
        metadata
      );

      const recentMetrics = PerformanceMonitor.getRecentMetrics(1);
      expect(recentMetrics[0].metadata).toEqual(metadata);
    });
  });

  describe('trackSync', () => {
    test('tracks successful sync operations', () => {
      const result = PerformanceMonitor.trackSync(
        'syncOperation',
        () => {
          // Simulate some work
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        }
      );

      expect(result).toBe(499500);

      const stats = PerformanceMonitor.getStats('syncOperation');
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(1);
      // Duration might be 0 for very fast operations due to rounding
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    test('tracks failed sync operations', () => {
      let errorThrown = false;

      try {
        PerformanceMonitor.trackSync(
          'syncOperation',
          () => {
            throw new Error('Sync test error');
          }
        );
      } catch (error) {
        errorThrown = true;
        expect((error as Error).message).toBe('Sync test error');
      }

      expect(errorThrown).toBe(true);

      const stats = PerformanceMonitor.getStats('syncOperation');
      expect(stats.failedOperations).toBe(1);
    });
  });

  describe('getStats', () => {
    test('returns correct statistics for operations', async () => {
      // Run multiple operations
      for (let i = 0; i < 5; i++) {
        await PerformanceMonitor.trackAsync(
          'multiOperation',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
            return 'success';
          }
        );
      }

      const stats = PerformanceMonitor.getStats('multiOperation');
      expect(stats.totalOperations).toBe(5);
      expect(stats.successfulOperations).toBe(5);
      expect(stats.averageDuration).toBeGreaterThan(0);
      expect(stats.medianDuration).toBeGreaterThan(0);
      expect(stats.p95Duration).toBeGreaterThan(0);
    });

    test('returns empty stats for non-existent operation', () => {
      const stats = PerformanceMonitor.getStats('nonExistent');
      expect(stats.totalOperations).toBe(0);
      expect(stats.successfulOperations).toBe(0);
      expect(stats.failedOperations).toBe(0);
      expect(stats.averageDuration).toBe(0);
    });

    test('calculates error rate correctly', async () => {
      // 3 successful operations
      for (let i = 0; i < 3; i++) {
        await PerformanceMonitor.trackAsync(
          'errorRateTest',
          async () => 'success'
        );
      }

      // 2 failed operations
      for (let i = 0; i < 2; i++) {
        try {
          await PerformanceMonitor.trackAsync(
            'errorRateTest',
            async () => { throw new Error('test'); }
          );
        } catch (e) {
          // Expected
        }
      }

      const errorRate = PerformanceMonitor.getErrorRate('errorRateTest');
      expect(errorRate).toBe(40); // 2 out of 5 = 40%
    });
  });

  describe('getOperationsSummary', () => {
    test('returns summary of all operations', async () => {
      await PerformanceMonitor.trackAsync('op1', async () => 'success');
      await PerformanceMonitor.trackAsync('op2', async () => 'success');
      await PerformanceMonitor.trackAsync('op1', async () => 'success');

      const summary = PerformanceMonitor.getOperationsSummary();

      expect(Object.keys(summary)).toContain('op1');
      expect(Object.keys(summary)).toContain('op2');
      expect(summary.op1.count).toBe(2);
      expect(summary.op2.count).toBe(1);
      expect(summary.op1.avgDuration).toBeGreaterThanOrEqual(0);
      expect(summary.op2.avgDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRecentMetrics', () => {
    test('returns recent metrics with limit', async () => {
      for (let i = 0; i < 10; i++) {
        await PerformanceMonitor.trackAsync(
          'recentTest',
          async () => `result${i}`,
          { result: `result${i}` }
        );
      }

      const recent = PerformanceMonitor.getRecentMetrics(5);
      expect(recent).toHaveLength(5);

      // Should return the most recent ones
      expect(recent[0].metadata?.result).toBe('result9');
      expect(recent[4].metadata?.result).toBe('result5');
    });
  });

  describe('clearMetrics', () => {
    test('clears all metrics', async () => {
      await PerformanceMonitor.trackAsync('clearTest', async () => 'success');

      expect(PerformanceMonitor.getStats('clearTest').totalOperations).toBe(1);

      PerformanceMonitor.clearMetrics();

      expect(PerformanceMonitor.getStats('clearTest').totalOperations).toBe(0);
    });
  });
});

describe('ResponseTimeTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('tracks response time correctly', () => {
    ResponseTimeTracker.start('request1');

    // Simulate 100ms delay
    jest.advanceTimersByTime(100);

    ResponseTimeTracker.end('request1', 'apiCall');

    // Check that the metric was recorded
    const recentMetrics = PerformanceMonitor.getRecentMetrics(1);
    expect(recentMetrics[0].operation).toBe('apiCall');
    expect(recentMetrics[0].metadata?.duration).toBe(100);
  });

  test('handles multiple concurrent requests', () => {
    ResponseTimeTracker.start('request1');
    ResponseTimeTracker.start('request2');

    jest.advanceTimersByTime(50);

    ResponseTimeTracker.end('request1', 'apiCall1');

    jest.advanceTimersByTime(50);

    ResponseTimeTracker.end('request2', 'apiCall2');

    const recentMetrics = PerformanceMonitor.getRecentMetrics(2);
    expect(recentMetrics).toHaveLength(2);
    expect(recentMetrics[0].operation).toBe('apiCall2');
    expect(recentMetrics[0].metadata?.duration).toBe(100);
    expect(recentMetrics[1].operation).toBe('apiCall1');
    expect(recentMetrics[1].metadata?.duration).toBe(50);
  });

  test('includes metadata in tracking', () => {
    ResponseTimeTracker.start('request1');

    jest.advanceTimersByTime(75);

    ResponseTimeTracker.end('request1', 'apiCall', { userId: '123', endpoint: '/api/test' });

    const recentMetrics = PerformanceMonitor.getRecentMetrics(1);
    expect(recentMetrics[0].metadata).toEqual({
      userId: '123',
      endpoint: '/api/test',
      requestId: 'request1',
      duration: 75
    });
  });

  test('handles non-existent request IDs gracefully', () => {
    // Should not throw error
    expect(() => {
      ResponseTimeTracker.end('nonExistent', 'apiCall');
    }).not.toThrow();
  });
});

describe('MemoryMonitor', () => {
  describe('getMemoryUsage', () => {
    test('returns memory usage in Node.js environment', () => {
      // Mock process.memoryUsage
      const mockMemoryUsage = {
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 100 * 1024 * 1024, // 100MB
        external: 0,
        rss: 0,
        arrayBuffers: 0
      };

      (global as any).process = {
        memoryUsage: jest.fn(() => mockMemoryUsage)
      };

      const usage = MemoryMonitor.getMemoryUsage();

      expect(usage.used).toBe(50); // 50MB
      expect(usage.total).toBe(100); // 100MB
      expect(usage.percentage).toBe(50); // 50%
    });

    test('returns memory usage in browser environment', () => {
      // Remove process mock
      delete (global as any).process;

      // Mock performance.memory
      (global as any).performance = {
        memory: {
          usedJSHeapSize: 30 * 1024 * 1024, // 30MB
          totalJSHeapSize: 60 * 1024 * 1024 // 60MB
        }
      };

      const usage = MemoryMonitor.getMemoryUsage();

      expect(usage.used).toBe(30); // 30MB
      expect(usage.total).toBe(60); // 60MB
      expect(usage.percentage).toBe(50); // 50%
    });

    test('returns zero values when no memory API available', () => {
      delete (global as any).process;
      delete (global as any).performance;

      const usage = MemoryMonitor.getMemoryUsage();

      expect(usage.used).toBe(0);
      expect(usage.total).toBe(0);
      expect(usage.percentage).toBe(0);
    });
  });

  describe('logMemoryUsage', () => {
    test('logs memory usage to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock memory usage
      (global as any).process = {
        memoryUsage: jest.fn(() => ({
          heapUsed: 25 * 1024 * 1024,
          heapTotal: 50 * 1024 * 1024
        }))
      };

      MemoryMonitor.logMemoryUsage();

      expect(consoleSpy).toHaveBeenCalledWith('Memory Usage: 25MB / 50MB (50%)');

      consoleSpy.mockRestore();
    });
  });
});