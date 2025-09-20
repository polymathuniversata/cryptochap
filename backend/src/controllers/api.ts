import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { UserModel, WalletModel, TransactionModel } from '../models';
import { CreateTransactionRequest, UpdateUserRequest, User } from '../types';
import { ValidationError, NotFoundError } from '../types';
import { openApiSpec } from '../docs/api-spec';
import { ERROR_CODES, formatErrorForUser } from '../docs/error-codes';
import {
  validateRequest,
  validateParams,
  validateQuery,
  validateSecurityConstraints,
  validationSchemas
} from '../middleware/validation';

const router = Router();

// Apply rate limiting to all routes
router.use(strictRateLimiter);

// Documentation endpoints
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

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// User routes
router.get('/users/:id',
  validateParams(validationSchemas.getUser),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: user
    });
  })
);

router.put('/users/:id',
  validateParams(validationSchemas.getUser),
  validateRequest(validationSchemas.updateUser),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: UpdateUserRequest = req.body;

    // Convert UpdateUserRequest to Partial<User> for the model
    const userUpdates: Partial<User> = {
      ...updates,
      preferences: updates.preferences ? {
        defaultCurrency: 'USDC',
        notifications: true,
        language: 'en',
        timezone: 'UTC',
        ...updates.preferences,
      } : undefined,
    };

    const user = await UserModel.update(id, userUpdates);

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  })
);

// Wallet routes
router.get('/users/:userId/wallets',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const wallets = await WalletModel.findByUserId(userId);

    res.json({
      success: true,
      data: wallets
    });
  })
);

router.get('/wallets/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const wallet = await WalletModel.findById(id);

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    res.json({
      success: true,
      data: wallet
    });
  })
);

router.post('/wallets',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, address, network } = req.body;

    if (!userId || !address || !network) {
      throw new ValidationError('Missing required fields: userId, address, network');
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const wallet = await WalletModel.create({ userId, address, network });

    res.status(201).json({
      success: true,
      data: wallet,
      message: 'Wallet created successfully'
    });
  })
);

router.put('/wallets/:id/balance',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { currency, amount } = req.body;

    if (!currency || !amount) {
      throw new ValidationError('Missing required fields: currency, amount');
    }

    // Verify wallet exists
    const wallet = await WalletModel.findById(id);
    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    await WalletModel.updateBalance(id, currency, amount);

    res.json({
      success: true,
      message: 'Wallet balance updated successfully'
    });
  })
);

// Transaction routes
router.get('/users/:userId/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const transactions = await TransactionModel.findByUserId(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: transactions,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  })
);

router.get('/transactions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const transaction = await TransactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    res.json({
      success: true,
      data: transaction
    });
  })
);

router.post('/transactions',
  validateRequest(validationSchemas.createTransaction),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const transactionData: CreateTransactionRequest = req.body;

    // Verify user exists
    const user = await UserModel.findById(transactionData.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Additional validation based on transaction type
    if (transactionData.type === 'send' && !transactionData.toAddress) {
      throw new ValidationError('Recipient address required for send transactions');
    }

    const transaction = await TransactionModel.create(transactionData);

    // Log transaction creation
    logger.info('Transaction created', {
      transactionId: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  })
);

router.put('/transactions/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, txHash, completedAt } = req.body;

    if (!status) {
      throw new ValidationError('Status is required');
    }

    const transaction = await TransactionModel.updateStatus(
      id,
      status,
      txHash,
      completedAt ? new Date(completedAt) : undefined
    );

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    // Log status update
    logger.info('Transaction status updated', {
      transactionId: transaction.id,
      oldStatus: transaction.status,
      newStatus: status,
      txHash
    });

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction status updated successfully'
    });
  })
);

// User statistics
router.get('/users/:userId/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const stats = await TransactionModel.getUserStats(userId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// WhatsApp webhook endpoint (enhanced)
router.post('/whatsapp/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('WhatsApp webhook received', {
      body: req.body,
      headers: req.headers
    });

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.json({ success: false, message: 'Invalid webhook payload' });
    }

    // Process webhook entries
    for (const entryItem of entry) {
      if (entryItem.messaging) {
        for (const message of entryItem.messaging) {
          // Process individual messages
          logger.info('Processing WhatsApp message', {
            from: message.from,
            type: message.type,
            messageId: message.id
          });

          // Here you would typically:
          // 1. Store the message in the database
          // 2. Process the message content
          // 3. Generate appropriate responses
          // 4. Send responses back via WhatsApp API
        }
      }
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  })
);

// WhatsApp webhook verification
router.get('/whatsapp/webhook', (req: Request, res: Response) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('WhatsApp webhook verification failed', { mode, token });
    res.status(403).send('Forbidden');
  }
});

export default router;