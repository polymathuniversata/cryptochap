/**
 * Validation Utilities Tests
 * Comprehensive tests for all validation functions
 */

/// <reference types="jest" />

import {
  PhoneValidator,
  AddressValidator,
  AmountValidator,
  CommandValidator,
  RateLimitValidator,
  InputSanitizer
} from './validation';

describe('PhoneValidator', () => {
  describe('validate', () => {
    test('valid phone numbers', () => {
      expect(PhoneValidator.validate('+1234567890').isValid).toBe(true);
      expect(PhoneValidator.validate('+19876543210').isValid).toBe(true);
      expect(PhoneValidator.validate('+447911123456').isValid).toBe(true);
      expect(PhoneValidator.validate('+919876543210').isValid).toBe(true);
    });

    test('invalid phone numbers', () => {
      expect(PhoneValidator.validate('1234567890').isValid).toBe(false);
      expect(PhoneValidator.validate('+123').isValid).toBe(false);
      expect(PhoneValidator.validate('invalid').isValid).toBe(false);
      expect(PhoneValidator.validate('').isValid).toBe(false);
      expect(PhoneValidator.validate('+12345678901234567890').isValid).toBe(false); // too long
      expect(PhoneValidator.validate('+123456').isValid).toBe(false); // too short
    });

    test('returns sanitized value for valid phones', () => {
      const result = PhoneValidator.validate('+1234567890');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('+1234567890');
    });

    test('returns errors for invalid phones', () => {
      const result = PhoneValidator.validate('1234567890');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format. Must start with + and contain only digits');
    });
  });

  describe('isValid', () => {
    test('returns boolean for quick validation', () => {
      expect(PhoneValidator.isValid('+1234567890')).toBe(true);
      expect(PhoneValidator.isValid('1234567890')).toBe(false);
    });
  });
});

describe('AddressValidator', () => {
  describe('validate', () => {
    test('valid Ethereum addresses', () => {
      expect(AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44e').isValid).toBe(true);
      expect(AddressValidator.validate('0x742D35CC6634C0532925A3B844BC454E4438F44E').isValid).toBe(true);
      expect(AddressValidator.validate('0x0000000000000000000000000000000000000000').isValid).toBe(true);
      expect(AddressValidator.validate('0xffffffffffffffffffffffffffffffffffffffff').isValid).toBe(true);
    });

    test('invalid Ethereum addresses', () => {
      expect(AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44').isValid).toBe(false); // too short
      expect(AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44ee').isValid).toBe(false); // too long
      expect(AddressValidator.validate('invalid').isValid).toBe(false);
      expect(AddressValidator.validate('').isValid).toBe(false);
      expect(AddressValidator.validate('0x742d35Cc6634C0532925a3b844Bc454e4438f44g').isValid).toBe(false); // invalid char
      expect(AddressValidator.validate('742d35Cc6634C0532925a3b844Bc454e4438f44e').isValid).toBe(false); // no 0x
    });

    test('returns sanitized value in lowercase', () => {
      const result = AddressValidator.validate('0x742D35CC6634C0532925A3B844BC454E4438F44E');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('0x742d35cc6634c0532925a3b844bc454e4438f44e');
    });

    test('handles null/undefined input', () => {
      expect(AddressValidator.validate(null as any).isValid).toBe(false);
      expect(AddressValidator.validate(undefined as any).isValid).toBe(false);
    });
  });

  describe('isValid', () => {
    test('returns boolean for quick validation', () => {
      expect(AddressValidator.isValid('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
      expect(AddressValidator.isValid('invalid')).toBe(false);
    });
  });
});

describe('AmountValidator', () => {
  describe('validate', () => {
    test('valid amounts', () => {
      expect(AmountValidator.validate('100').isValid).toBe(true);
      expect(AmountValidator.validate('50.5').isValid).toBe(true);
      expect(AmountValidator.validate('0.01').isValid).toBe(true);
      expect(AmountValidator.validate('123456789.123456789').isValid).toBe(true);
      expect(AmountValidator.validate(100).isValid).toBe(true);
      expect(AmountValidator.validate(50.5).isValid).toBe(true);
    });

    test('invalid amounts', () => {
      expect(AmountValidator.validate('-100').isValid).toBe(false);
      expect(AmountValidator.validate('0').isValid).toBe(false);
      expect(AmountValidator.validate('-0.01').isValid).toBe(false);
      expect(AmountValidator.validate('invalid').isValid).toBe(false);
      expect(AmountValidator.validate('').isValid).toBe(false);
      expect(AmountValidator.validate(null as any).isValid).toBe(false);
      expect(AmountValidator.validate('1.234567890').isValid).toBe(false); // too many decimals
    });

    test('amount limits', () => {
      expect(AmountValidator.validate('100', { max: 50 }).isValid).toBe(false);
      expect(AmountValidator.validate('10', { min: 50 }).isValid).toBe(false);
      expect(AmountValidator.validate('25', { min: 10, max: 50 }).isValid).toBe(true);
    });

    test('decimal places validation', () => {
      expect(AmountValidator.validate('1.23', { decimals: 2 }).isValid).toBe(true);
      expect(AmountValidator.validate('1.234', { decimals: 2 }).isValid).toBe(false);
      expect(AmountValidator.validate('1.23456', { decimals: 5 }).isValid).toBe(true);
    });

    test('returns sanitized numeric value', () => {
      const result = AmountValidator.validate('50.5');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(50.5);
    });
  });

  describe('isValid', () => {
    test('returns boolean for quick validation', () => {
      expect(AmountValidator.isValid('100')).toBe(true);
      expect(AmountValidator.isValid('-100')).toBe(false);
      expect(AmountValidator.isValid('100', { max: 50 })).toBe(false);
    });
  });
});

describe('CommandValidator', () => {
  describe('validateCommand', () => {
    test('valid commands', () => {
      expect(CommandValidator.validateCommand('balance').isValid).toBe(true);
      expect(CommandValidator.validateCommand('buy 50').isValid).toBe(true);
      expect(CommandValidator.validateCommand('send 10 USDC to 0x123').isValid).toBe(true);
      expect(CommandValidator.validateCommand('help').isValid).toBe(true);
      expect(CommandValidator.validateCommand('menu').isValid).toBe(true);
    });

    test('invalid commands', () => {
      expect(CommandValidator.validateCommand('').isValid).toBe(false);
      expect(CommandValidator.validateCommand('<script>alert("xss")</script>').isValid).toBe(false);
      expect(CommandValidator.validateCommand('alert("xss")').isValid).toBe(false);
      expect(CommandValidator.validateCommand('command; rm -rf /').isValid).toBe(false);
    });

    test('command length limits', () => {
      const longCommand = 'a'.repeat(101);
      expect(CommandValidator.validateCommand(longCommand).isValid).toBe(false);
      expect(CommandValidator.validateCommand('a'.repeat(100)).isValid).toBe(true);
    });

    test('sanitizes dangerous characters', () => {
      expect(CommandValidator.validateCommand('<script>alert("xss")</script>').errors)
        .toContain('Command contains invalid characters');
      expect(CommandValidator.validateCommand('command; rm -rf /').errors)
        .toContain('Command contains invalid characters');
    });
  });

  describe('getHelpMessage', () => {
    test('returns general help when no command specified', () => {
      const help = CommandValidator.getHelpMessage();
      expect(help).toContain('🤖 Available Commands');
      expect(help).toContain('balance');
      expect(help).toContain('buy');
      expect(help).toContain('send');
      expect(help).toContain('help');
    });

    test('returns specific help for command', () => {
      const help = CommandValidator.getHelpMessage('balance');
      expect(help).toContain('Help for "balance" command');
    });
  });
});

describe('RateLimitValidator', () => {
  let validator: RateLimitValidator;

  beforeEach(() => {
    validator = new RateLimitValidator();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(validator.validate('user1').isValid).toBe(true);
    }
  });

  test('blocks requests over limit', () => {
    // Use up all attempts
    for (let i = 0; i < 10; i++) {
      validator.validate('user1');
    }

    // Next request should be blocked
    const result = validator.validate('user1');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Rate limit exceeded');
  });

  test('resets after window expires', () => {
    // Use up all attempts
    for (let i = 0; i < 10; i++) {
      validator.validate('user1');
    }

    // Fast forward time past the window
    jest.advanceTimersByTime(61000);

    // Should allow requests again
    expect(validator.validate('user1').isValid).toBe(true);
  });

  test('tracks different users separately', () => {
    // User 1 uses up their limit
    for (let i = 0; i < 10; i++) {
      validator.validate('user1');
    }

    // User 2 should still be allowed
    expect(validator.validate('user2').isValid).toBe(true);
  });

  test('custom limits work', () => {
    const customValidator = new RateLimitValidator();

    // Should allow only 5 requests
    for (let i = 0; i < 5; i++) {
      expect(customValidator.validate('user1', 5).isValid).toBe(true);
    }

    expect(customValidator.validate('user1', 5).isValid).toBe(false);
  });

  test('custom window works', () => {
    const customValidator = new RateLimitValidator();

    // Use up attempts
    for (let i = 0; i < 5; i++) {
      customValidator.validate('user1', 5, 30000); // 30 second window
    }

    // Fast forward 30 seconds
    jest.advanceTimersByTime(30000);

    // Should allow requests again
    expect(customValidator.validate('user1', 5, 30000).isValid).toBe(true);
  });
});

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    test('removes null bytes', () => {
      expect(InputSanitizer.sanitizeString('test\u0000string')).toBe('teststring');
    });

    test('limits length', () => {
      const longString = 'a'.repeat(200);
      expect(InputSanitizer.sanitizeString(longString, { maxLength: 100 })).toHaveLength(100);
    });

    test('sanitizes HTML when not allowed', () => {
      expect(InputSanitizer.sanitizeString('<script>alert("xss")</script>', { allowHtml: false }))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('allows HTML when specified', () => {
      expect(InputSanitizer.sanitizeString('<b>test</b>', { allowHtml: true }))
        .toBe('<b>test</b>');
    });

    test('handles null/undefined input', () => {
      expect(InputSanitizer.sanitizeString(null as any)).toBe('');
      expect(InputSanitizer.sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    test('sanitizes object properties', () => {
      const obj = {
        name: 'test',
        email: 'test@example.com',
        dangerous: '<script>alert("xss")</script>'
      };

      const schema = {
        name: { type: 'string', maxLength: 50 },
        email: { type: 'string', maxLength: 100 },
        dangerous: { type: 'string', allowHtml: false }
      };

      const result = InputSanitizer.sanitizeObject(obj, schema);
      expect(result.dangerous).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });
});