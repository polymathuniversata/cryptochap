/**
 * Sprint 1 Validation Tests
 * Tests for input validation and performance monitoring
 */

/// <reference types="jest" />

import { PhoneValidator, AddressValidator, AmountValidator, CommandValidator, RateLimitValidator } from './lib/utils/validation';
import { PerformanceMonitor } from './lib/utils/performance';

describe('Input Validation Tests', () => {
  describe('PhoneValidator', () => {
    test('valid phone numbers', () => {
      expect(PhoneValidator.validate('+1234567890').isValid).toBe(true);
      expect(PhoneValidator.validate('+19876543210').isValid).toBe(true);
      expect(PhoneValidator.validate('+447911123456').isValid).toBe(true);
    });

    test('invalid phone numbers', () => {
      expect(PhoneValidator.validate('1234567890').isValid).toBe(false);
      expect(PhoneValidator.validate('+123').isValid).toBe(false);
      expect(PhoneValidator.validate('invalid').isValid).toBe(false);
      expect(PhoneValidator.validate('').isValid).toBe(false);
    });
  });

  describe('AddressValidator', () => {
    test('valid Ethereum addresses', () => {
      expect(AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44e').isValid).toBe(true);
      expect(AddressValidator.validate('0x742D35CC6634C0532925A3B844BC454E4438F44E').isValid).toBe(true);
    });

    test('invalid Ethereum addresses', () => {
      expect(AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44').isValid).toBe(false);
      expect(AddressValidator.validate('invalid').isValid).toBe(false);
      expect(AddressValidator.validate('').isValid).toBe(false);
    });
  });

  describe('AmountValidator', () => {
    test('valid amounts', () => {
      expect(AmountValidator.validate('100').isValid).toBe(true);
      expect(AmountValidator.validate('50.5').isValid).toBe(true);
      expect(AmountValidator.validate(100).isValid).toBe(true);
    });

    test('invalid amounts', () => {
      expect(AmountValidator.validate('-100').isValid).toBe(false);
      expect(AmountValidator.validate('0').isValid).toBe(false);
      expect(AmountValidator.validate('invalid').isValid).toBe(false);
      expect(AmountValidator.validate('').isValid).toBe(false);
    });

    test('amount limits', () => {
      expect(AmountValidator.validate('10000', { max: 5000 }).isValid).toBe(false);
      expect(AmountValidator.validate('0.5', { min: 1 }).isValid).toBe(false);
    });
  });

  describe('CommandValidator', () => {
    test('valid commands', () => {
      expect(CommandValidator.validateCommand('balance').isValid).toBe(true);
      expect(CommandValidator.validateCommand('buy 50').isValid).toBe(true);
      expect(CommandValidator.validateCommand('send 10 USDC to 0x123').isValid).toBe(true);
    });

    test('invalid commands', () => {
      expect(CommandValidator.validateCommand('<script>alert("xss")</script>').isValid).toBe(false);
      expect(CommandValidator.validateCommand('').isValid).toBe(false);
    });
  });

  describe('RateLimitValidator', () => {
    test('rate limiting', () => {
      const validator = new RateLimitValidator();

      // First few requests should pass
      for (let i = 0; i < 10; i++) {
        expect(validator.validate('user1').isValid).toBe(true);
      }

      // Next request should be rate limited
      expect(validator.validate('user1').isValid).toBe(false);
    });
  });
});

describe('Performance Monitoring Tests', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  test('track async operations', async () => {
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
  });

  test('track failed operations', async () => {
    try {
      await PerformanceMonitor.trackAsync(
        'testOperation',
        async () => {
          throw new Error('Test error');
        }
      );
    } catch (error) {
      // Expected
    }

    const stats = PerformanceMonitor.getStats('testOperation');
    expect(stats.totalOperations).toBe(1);
    expect(stats.successfulOperations).toBe(0);
    expect(stats.failedOperations).toBe(1);
  });

  test('performance statistics', async () => {
    // Run multiple operations
    for (let i = 0; i < 5; i++) {
      await PerformanceMonitor.trackAsync(
        'testOperation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return 'success';
        }
      );
    }

    const stats = PerformanceMonitor.getStats('testOperation');
    expect(stats.totalOperations).toBe(5);
    expect(stats.averageDuration).toBeGreaterThan(0);
    expect(stats.medianDuration).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  test('MessageProcessor validation integration', async () => {
    // This would require mocking the MessageProcessor
    // For now, just test that the validation utilities work together
    const phoneValidation = PhoneValidator.validate('+1234567890');
    const addressValidation = AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    const amountValidation = AmountValidator.validate('50');

    expect(phoneValidation.isValid).toBe(true);
    expect(addressValidation.isValid).toBe(true);
    expect(amountValidation.isValid).toBe(true);
  });
});