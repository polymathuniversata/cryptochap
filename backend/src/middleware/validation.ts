import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types';
import { logger } from '../utils/logger';

/**
 * Validation schemas for different request types
 */
export const schemas = {
  // User validation schemas
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    }),

  phoneNumber: Joi.string()
    .pattern(/^(\+)[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)',
      'any.required': 'Phone number is required'
    }),

  walletAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Wallet address must be a valid Ethereum address (0x...)',
      'any.required': 'Wallet address is required'
    }),

  // Transaction validation schemas
  transactionAmount: Joi.string()
    .pattern(/^\d+(\.\d{1,18})?$/)
    .required()
    .messages({
      'string.pattern.base': 'Amount must be a valid number with up to 18 decimal places',
      'any.required': 'Transaction amount is required'
    }),

  currency: Joi.string()
    .valid('USDC', 'ETH', 'BASE')
    .required()
    .messages({
      'any.only': 'Currency must be one of: USDC, ETH, BASE',
      'any.required': 'Currency is required'
    }),

  network: Joi.string()
    .valid('base', 'ethereum', 'sepolia')
    .required()
    .messages({
      'any.only': 'Network must be one of: base, ethereum, sepolia',
      'any.required': 'Network is required'
    }),

  transactionType: Joi.string()
    .valid('send', 'receive', 'buy', 'sell', 'swap', 'deposit', 'withdraw')
    .required()
    .messages({
      'any.only': 'Transaction type must be one of: send, receive, buy, sell, swap, deposit, withdraw',
      'any.required': 'Transaction type is required'
    }),

  // Pagination schemas
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),

    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'amount', 'type')
      .default('createdAt'),

    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
  }),

  // WhatsApp message schemas
  whatsappMessage: Joi.object({
    to: Joi.string()
      .pattern(/^(\+)[1-9][\d]{0,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Recipient must be a valid phone number in international format',
        'any.required': 'Recipient phone number is required'
      }),

    message: Joi.string()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Message must be at least 1 character long',
        'string.max': 'Message cannot exceed 1000 characters',
        'any.required': 'Message content is required'
      }),

    type: Joi.string()
      .valid('text', 'image', 'video', 'document', 'audio')
      .default('text')
  }),

  // Address validation for crypto operations
  cryptoAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Address must be a valid Ethereum-compatible address (0x...)',
      'any.required': 'Address is required'
    }),

  // Amount validation with different decimal places
  tokenAmount: (decimals: number = 18) => Joi.string()
    .pattern(new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`))
    .required()
    .messages({
      'string.pattern.base': `Amount must be a valid number with up to ${decimals} decimal places`,
      'any.required': 'Amount is required'
    })
};

/**
 * Validation middleware factory
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed', {
        endpoint: req.path,
        method: req.method,
        errors: validationErrors,
        body: req.body
      });

      throw new ValidationError('Request validation failed', {
        errors: validationErrors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
}

/**
 * Parameter validation middleware
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Parameter validation failed', {
        endpoint: req.path,
        method: req.method,
        errors: validationErrors,
        params: req.params
      });

      throw new ValidationError('Request parameter validation failed', {
        errors: validationErrors
      });
    }

    // Replace req.params with validated data
    req.params = value;
    next();
  };
}

/**
 * Query validation middleware
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Query validation failed', {
        endpoint: req.path,
        method: req.method,
        errors: validationErrors,
        query: req.query
      });

      throw new ValidationError('Request query validation failed', {
        errors: validationErrors
      });
    }

    // Replace req.query with validated data
    req.query = value;
    next();
  };
}

/**
 * Sanitize input data
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .substring(0, 10000); // Limit length
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Common validation schemas for different endpoints
 */
export const validationSchemas = {
  // User routes
  getUser: Joi.object({
    id: schemas.userId
  }),

  updateUser: Joi.object({
    phoneNumber: schemas.phoneNumber.optional(),
    walletAddress: schemas.walletAddress.optional(),
    isActive: Joi.boolean().optional(),
    preferences: Joi.object({
      defaultCurrency: Joi.string().valid('USD', 'EUR', 'GBP').optional(),
      notifications: Joi.boolean().optional(),
      language: Joi.string().min(2).max(5).optional(),
      timezone: Joi.string().optional()
    }).optional()
  }),

  // Transaction routes
  createTransaction: Joi.object({
    userId: schemas.userId,
    type: schemas.transactionType,
    amount: schemas.transactionAmount,
    currency: schemas.currency,
    toAddress: schemas.cryptoAddress.optional(),
    network: schemas.network,
    description: Joi.string().max(500).optional().allow('')
  }),

  // WhatsApp routes
  sendMessage: schemas.whatsappMessage,

  // Pagination
  listTransactions: schemas.pagination
};

/**
 * Security validation for sensitive operations
 */
export function validateSecurityConstraints(req: Request, res: Response, next: NextFunction) {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /[<>]/, // HTML tags
    /javascript:/i, // JavaScript protocols
    /data:/i, // Data protocols
    /vbscript:/i, // VBScript protocols
    /onload=/i, // Event handlers
    /onerror=/i
  ];

  const bodyString = JSON.stringify(req.body);
  const queryString = JSON.stringify(req.query);
  const paramsString = JSON.stringify(req.params);

  const allInput = bodyString + queryString + paramsString;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(allInput)) {
      logger.warn('Suspicious input detected', {
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      throw new ValidationError('Suspicious input detected', {
        pattern: pattern.toString()
      });
    }
  }

  next();
}
