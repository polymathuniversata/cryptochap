import { Router, Request, Response } from 'express';
import { openApiSpec } from '../docs/api-spec';
import { ERROR_CODES } from '../docs/error-codes';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoints
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Documentation',
    documentation: {
      openapi: '/api/docs/openapi.json',
      errorCodes: '/api/docs/errors',
      health: '/api/health'
    }
  });
});

router.get('/docs/openapi.json', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: openApiSpec,
    message: 'OpenAPI 3.0 specification for CryptoChap API'
  });
});

router.get('/docs/errors', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(ERROR_CODES),
    message: 'Comprehensive error code documentation'
  });
});

// System metrics endpoint (for monitoring)
router.get('/metrics', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();

  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
