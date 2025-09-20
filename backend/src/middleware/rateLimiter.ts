import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.url === '/health';
  }
});

// Stricter rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again in a minute.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      url: req.url
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again in a minute.',
      retryAfter: '1 minute'
    });
  }
});