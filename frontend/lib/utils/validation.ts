/**
 * Input validation utilities for CryptoChap
 * Provides comprehensive validation for all user inputs
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

/**
 * Ethereum address validation
 */
export class AddressValidator {
  private static readonly ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

  static validate(address: string): ValidationResult {
    const errors: string[] = [];

    if (!address) {
      errors.push('Address is required');
      return { isValid: false, errors };
    }

    if (typeof address !== 'string') {
      errors.push('Address must be a string');
      return { isValid: false, errors };
    }

    const trimmed = address.trim();

    if (!this.ETH_ADDRESS_REGEX.test(trimmed)) {
      errors.push('Invalid Ethereum address format');
      return { isValid: false, errors };
    }

    // Additional checksum validation could be added here

    return {
      isValid: true,
      errors: [],
      sanitizedValue: trimmed.toLowerCase()
    };
  }

  static isValid(address: string): boolean {
    return this.validate(address).isValid;
  }
}

/**
 * Phone number validation
 */
export class PhoneValidator {
  private static readonly PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

  static validate(phone: string): ValidationResult {
    const errors: string[] = [];

    if (!phone) {
      errors.push('Phone number is required');
      return { isValid: false, errors };
    }

    if (typeof phone !== 'string') {
      errors.push('Phone number must be a string');
      return { isValid: false, errors };
    }

    const trimmed = phone.trim();

    if (!this.PHONE_REGEX.test(trimmed)) {
      errors.push('Invalid phone number format. Must start with + and contain only digits');
      return { isValid: false, errors };
    }

    // Check length (E.164 format allows 7-15 digits after +)
    const digitsOnly = trimmed.substring(1);
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      errors.push('Phone number must contain 7-15 digits');
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedValue: trimmed
    };
  }

  static isValid(phone: string): boolean {
    return this.validate(phone).isValid;
  }
}

/**
 * Amount validation
 */
export class AmountValidator {
  private static readonly AMOUNT_REGEX = /^\d+(\.\d{1,18})?$/;

  static validate(amount: string | number, options: {
    min?: number;
    max?: number;
    decimals?: number;
  } = {}): ValidationResult {
    const errors: string[] = [];

    if (amount === null || amount === undefined || amount === '') {
      errors.push('Amount is required');
      return { isValid: false, errors };
    }

    let numValue: number;

    if (typeof amount === 'string') {
      const trimmed = amount.trim();

      if (!this.AMOUNT_REGEX.test(trimmed)) {
        errors.push('Invalid amount format. Must be a positive number');
        return { isValid: false, errors };
      }

      numValue = parseFloat(trimmed);
    } else if (typeof amount === 'number') {
      numValue = amount;
    } else {
      errors.push('Amount must be a number or string');
      return { isValid: false, errors };
    }

    if (isNaN(numValue)) {
      errors.push('Amount must be a valid number');
      return { isValid: false, errors };
    }

    if (numValue <= 0) {
      errors.push('Amount must be greater than 0');
      return { isValid: false, errors };
    }

    if (options.min !== undefined && numValue < options.min) {
      errors.push(`Amount must be at least ${options.min}`);
    }

    if (options.max !== undefined && numValue > options.max) {
      errors.push(`Amount must be at most ${options.max}`);
    }

    if (options.decimals !== undefined) {
      const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
      if (decimalPlaces > options.decimals) {
        errors.push(`Amount must have at most ${options.decimals} decimal places`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: numValue
    };
  }

  static isValid(amount: string | number, options?: any): boolean {
    return this.validate(amount, options).isValid;
  }
}

/**
 * Command validation
 */
export class CommandValidator {
  private static readonly ALLOWED_COMMANDS = [
    'balance', 'address', 'buy', 'send', 'history', 'help',
    'menu', 'price', 'settings'
  ];

  static validateCommand(command: string): ValidationResult {
    const errors: string[] = [];

    if (!command) {
      errors.push('Command is required');
      return { isValid: false, errors };
    }

    if (typeof command !== 'string') {
      errors.push('Command must be a string');
      return { isValid: false, errors };
    }

    const trimmed = command.trim().toLowerCase();

    if (trimmed.length > 100) {
      errors.push('Command is too long');
      return { isValid: false, errors };
    }

    // Check for potentially dangerous characters
    const dangerousChars = /[<>\"';&|]/;
    if (dangerousChars.test(trimmed)) {
      errors.push('Command contains invalid characters');
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedValue: trimmed
    };
  }

  static getHelpMessage(command?: string): string {
    if (command) {
      return `Help for "${command}" command. Type "help" for all commands.`;
    }

    return `🤖 Available Commands:
• "balance" - Check wallet balance
• "address" - Get deposit address
• "buy 50" - Purchase USDC
• "send 10 USDC to 0x..." - Transfer tokens
• "send 5 USDC to +1234567890" - Send to phone
• "history" - View transactions
• "menu" - Show interactive menu
• "help" - Show this help message

Type "help <command>" for detailed usage.`;
  }
}

/**
 * General input sanitization
 */
export class InputSanitizer {
  static sanitizeString(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
  } = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Limit length
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Basic HTML sanitization if not allowed
    if (!options.allowHtml) {
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    return sanitized;
  }

  static sanitizeObject(obj: any, schema: any): any {
    // Implement object sanitization based on schema
    // This would be more complex in a real implementation
    return obj;
  }
}

/**
 * Rate limiting validation
 */
export class RateLimitValidator {
  private attempts = new Map<string, number[]>();

  validate(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): ValidationResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    const userAttempts = this.attempts.get(identifier) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);

    if (recentAttempts.length >= maxAttempts) {
      return {
        isValid: false,
        errors: [`Rate limit exceeded. Try again in ${Math.ceil((recentAttempts[0] + windowMs - now) / 1000)} seconds.`]
      };
    }

    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return { isValid: true, errors: [] };
  }
}

// Export singleton instances
export const addressValidator = new AddressValidator();
export const phoneValidator = new PhoneValidator();
export const amountValidator = new AmountValidator();
export const commandValidator = new CommandValidator();
export const inputSanitizer = new InputSanitizer();
export const rateLimitValidator = new RateLimitValidator();