import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './services/logging.service';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { db } from './utils/database';
import { monitoring } from './services/monitoring.service';
import { securityHeaders, apiSecurityHeaders, requestIdMiddleware } from './middleware/security';
import systemRoutes from './controllers/system';
import userRoutes from './controllers/users';
import walletRoutes from './controllers/wallets';
import transactionRoutes from './controllers/transactions';
import whatsAppRoutes from './controllers/whatsapp';

const app = express();

// Request ID middleware (should be first)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// API-specific security headers
app.use('/api', apiSecurityHeaders);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await db.healthCheck();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth ? 'connected' : 'disconnected',
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// WhatsApp webhook endpoint (before API prefix to avoid conflicts)
app.use('/whatsapp', whatsAppRoutes);

// API routes
app.use('/api/system', systemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);

// Legacy routes for backward compatibility
app.get('/api/health', (req, res) => {
  res.redirect('/health');
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.PORT, async () => {
  logger.info(`CryptoChap Backend server starting...`, {
    port: config.PORT,
    environment: config.NODE_ENV,
    network: config.NETWORK
  });

  // Test database connection
  try {
    await db.healthCheck();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed', { error: (error as Error).message });
    process.exit(1);
  }

  logger.info(`CryptoChap Backend server running on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await db.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { error: (error as Error).message });
    }

    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await db.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { error: (error as Error).message });
    }

    process.exit(0);
  });
});

export default app;