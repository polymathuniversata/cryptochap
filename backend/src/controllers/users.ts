import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserModel } from '../models';
import { UpdateUserRequest, User } from '../types';
import { ValidationError, NotFoundError } from '../types';
import {
  validateParams,
  validateRequest,
  validateSecurityConstraints,
  validationSchemas
} from '../middleware/validation';

const router = Router();

// Get user by ID
router.get('/:id',
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

// Update user
router.put('/:id',
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

// Delete user (soft delete)
router.delete('/:id',
  validateParams(validationSchemas.getUser),
  validateSecurityConstraints,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Soft delete by setting isActive to false
    await UserModel.update(id, { isActive: false });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  })
);

export default router;
