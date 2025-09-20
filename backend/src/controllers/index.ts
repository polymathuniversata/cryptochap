import { Router } from 'express';
import systemRoutes from './system';
import userRoutes from './users';
import walletRoutes from './wallets';
import transactionRoutes from './transactions';

const router = Router();

// Mount modular route handlers
router.use('/system', systemRoutes);
router.use('/users', userRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);

// Legacy routes for backward compatibility
// These will be deprecated in future versions
router.get('/health', (req, res) => {
  res.redirect('/api/system/health');
});

// WhatsApp webhook endpoint
router.post('/whatsapp/webhook', (req, res) => {
  // Webhook processing logic will be implemented here
  res.json({
    success: true,
    message: 'Webhook received'
  });
});

// Legacy wallet endpoints (to be migrated)
router.get('/wallet/balance/:address', (req, res) => {
  // Legacy endpoint - should be migrated to new structure
  res.json({
    success: true,
    data: {
      address: req.params.address,
      balance: {
        usdc: '0.00',
        eth: '0.00'
      }
    }
  });
});

export default router;