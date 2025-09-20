import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserModel, WalletModel } from '../models';
import { ValidationError, NotFoundError } from '../types';
import {
  validateParams,
  validateRequest,
  validateSecurityConstraints,
  schemas
} from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Get user wallets
router.get('/users/:userId/wallets',
  validateParams(Joi.object({
    userId: Joi.string().uuid().required()
  })),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const wallets = await WalletModel.findByUserId(userId);

    res.json({
      success: true,
      data: wallets
    });
  })
);

// Get wallet by ID
router.get('/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required()
  })),
  validateSecurityConstraints,
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

// Create wallet
router.post('/',
  validateRequest(Joi.object({
    userId: Joi.string().uuid().required(),
    address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    network: Joi.string().valid('base', 'ethereum', 'sepolia').required()
  })),
  validateSecurityConstraints,
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

// Update wallet balance
router.put('/:id/balance',
  validateParams(Joi.object({
    id: Joi.string().uuid().required()
  })),
  validateRequest(Joi.object({
    currency: Joi.string().valid('USDC', 'ETH', 'BASE').required(),
    amount: Joi.string().pattern(/^\d+(\.\d{1,18})?$/).required()
  })),
  validateSecurityConstraints,
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

// Delete wallet
router.delete('/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required()
  })),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const wallet = await WalletModel.findById(id);
    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    // Soft delete by updating isActive field instead
    await WalletModel.update(id, { isActive: false });

    res.json({
      success: true,
      message: 'Wallet deactivated successfully'
    });
  })
);

export default router;
