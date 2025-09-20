import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 * Implements Content Security Policy and other security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  const isDevelopment = process.env.NODE_ENV === 'development';

  let cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.coingecko.com https://*.base.org https://*.infura.io wss://*.infura.io",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  // Stricter CSP for production
  if (!isDevelopment) {
    cspDirectives = cspDirectives.map(directive => {
      // Remove unsafe-inline and unsafe-eval in production
      if (directive.includes("'unsafe-inline'")) {
        return directive.replace("'unsafe-inline'", '');
      }
      if (directive.includes("'unsafe-eval'")) {
        return directive.replace("'unsafe-eval'", '');
      }
      return directive;
    });
  }

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // HTTP Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cross-Origin Embedder Policy
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin Opener Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin Resource Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * API-specific security headers
 */
export function apiSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // API-specific CSP
  res.setHeader('Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; form-action 'none'"
  );

  // Additional API security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // CORS headers for API
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter(Boolean);

  if (allowedOrigins.includes(origin || '')) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

/**
 * Webhook security headers
 */
export function webhookSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Minimal CSP for webhooks
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  // Stricter security for webhook endpoints
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');

  next();
}

/**
 * Rate limiting headers
 */
export function addRateLimitHeaders(req: Request, res: Response, next: NextFunction) {
  // Add rate limiting headers
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '99');
  res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 900); // 15 minutes

  next();
}

/**
 * Request ID middleware for tracing
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string ||
                   req.headers['cf-ray'] as string ||
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader('X-Request-ID', requestId);
  req.headers['x-request-id'] = requestId;

  next();
}
