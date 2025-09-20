import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserModel, TransactionModel } from '../models';
import { CreateTransactionRequest } from '../types';
import { ValidationError, NotFoundError } from '../types';
import {
  validateRequest,
  validateParams,
  validateQuery,
  validateSecurityConstraints,
  validationSchemas
} from '../middleware/validation';

const router = Router();

// Get user transactions with pagination
router.get('/users/:userId/transactions',
  validateParams(validationSchemas.getUser),
  validateQuery(validationSchemas.listTransactions),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const transactions = await TransactionModel.findByUserId(
      userId,
      parseInt(limit as string),
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: transactions.length, // This would be calculated properly in a real implementation
        hasNext: transactions.length === parseInt(limit as string),
        hasPrev: parseInt(page as string) > 1
      }
    });
  })
);

// Get transaction by ID
router.get('/:id',
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  validateSecurityConstraints,
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

// Create transaction
router.post('/',
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

// Update transaction status
router.put('/:id/status',
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  validateRequest(Joi.object({
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled').required(),
    txHash: Joi.string().optional(),
    completedAt: Joi.date().optional()
  })),
  validateSecurityConstraints,
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
      status,
      txHash
    });

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction status updated successfully'
    });
  })
);

export default router;
