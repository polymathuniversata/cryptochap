import { Router, Request, Response } from 'express';
import { whatsAppEngine } from '../services/whatsapp-engine.service';
import { asyncHandler } from '../middleware/errorHandler';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../services/logging.service';

const router = Router();

/**
 * WhatsApp webhook verification endpoint
 * Handles the initial verification request from WhatsApp
 */
router.get('/webhook', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
      // Check the mode and token sent is correct
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        // Respond with the challenge token from the request
        logger.info('WhatsApp webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        logger.warn('WhatsApp webhook verification failed - invalid token');
        res.sendStatus(403);
      }
    } else {
      logger.warn('WhatsApp webhook verification failed - missing parameters');
      res.sendStatus(400);
    }
  } catch (error) {
    logger.error('Error in WhatsApp webhook verification', {
      error: (error as Error).message
    });
    res.sendStatus(500);
  }
});

/**
 * WhatsApp webhook message handler
 * Processes incoming WhatsApp messages and commands
 */
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Log incoming webhook for debugging
    logger.info('WhatsApp webhook received', {
      body: JSON.stringify(req.body),
      headers: req.headers
    });

    // Process the webhook using the WhatsApp engine
    await whatsAppEngine.processWebhook(req, res);

  } catch (error) {
    logger.error('Error processing WhatsApp webhook', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });

    // If response hasn't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error processing WhatsApp webhook'
      });
    }
  }
}));

/**
 * WhatsApp message status endpoint
 * Handles delivery and read status updates from WhatsApp
 */
router.post('/webhook/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.info('WhatsApp message status update', {
      payload: JSON.stringify(payload)
    });

    // Handle message status updates (delivered, read, failed)
    if (payload.entry && payload.entry.length > 0) {
      for (const entry of payload.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value.statuses) {
              for (const status of change.value.statuses) {
                logger.info('Message status update', {
                  messageId: status.id,
                  status: status.status,
                  recipientId: status.recipient_id,
                  timestamp: status.timestamp
                });
              }
            }
          }
        }
      }
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    logger.error('Error processing WhatsApp status webhook', {
      error: (error as Error).message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}));

/**
 * Send WhatsApp message (for testing purposes)
 * POST /api/whatsapp/send
 */
router.post('/send', strictRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { to, message, messageType = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Missing required fields: to, message'
      });
    }

    // Validate phone number format
    if (!/^\+?[1-9]\d{1,14}$/.test(to)) {
      return res.status(400).json({
        error: 'Invalid phone number format'
      });
    }

    // In a real implementation, this would send the message via WhatsApp API
    // For now, we'll just log it and return success
    logger.info('WhatsApp message send requested', {
      to,
      messageType,
      messageLength: message.length
    });

    // TODO: Implement actual WhatsApp API call
    // const result = await sendWhatsAppMessage(to, message, messageType);

    res.json({
      success: true,
      messageId: 'mock_' + Date.now(),
      to,
      messageType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error sending WhatsApp message', {
      error: (error as Error).message
    });
    res.status(500).json({
      error: 'Failed to send WhatsApp message'
    });
  }
}));

/**
 * Get WhatsApp configuration status
 * GET /api/whatsapp/status
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const configStatus = {
      webhookConfigured: !!process.env.WHATSAPP_VERIFY_TOKEN,
      accessTokenConfigured: !!process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberIdConfigured: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountIdConfigured: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      appIdConfigured: !!process.env.WHATSAPP_APP_ID
    };

    const allConfigured = Object.values(configStatus).every(Boolean);

    res.json({
      status: allConfigured ? 'configured' : 'incomplete',
      configuration: configStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error checking WhatsApp status', {
      error: (error as Error).message
    });
    res.status(500).json({
      error: 'Failed to check WhatsApp status'
    });
  }
}));

/**
 * Interactive message templates
 * POST /api/whatsapp/templates
 */
router.post('/templates', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { templateName, to, parameters } = req.body;

    if (!templateName || !to) {
      return res.status(400).json({
        error: 'Missing required fields: templateName, to'
      });
    }

    logger.info('WhatsApp template send requested', {
      templateName,
      to,
      parameters
    });

    // In a real implementation, this would send a template message
    // TODO: Implement WhatsApp template API call

    res.json({
      success: true,
      messageId: 'template_' + Date.now(),
      templateName,
      to,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error sending WhatsApp template', {
      error: (error as Error).message
    });
    res.status(500).json({
      error: 'Failed to send WhatsApp template'
    });
  }
}));

/**
 * Health check for WhatsApp integration
 * GET /api/whatsapp/health
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      service: 'whatsapp',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        webhook: !!process.env.WHATSAPP_VERIFY_TOKEN,
        messaging: !!process.env.WHATSAPP_ACCESS_TOKEN,
        templates: !!process.env.WHATSAPP_PHONE_NUMBER_ID
      }
    };

    res.json(healthStatus);

  } catch (error) {
    logger.error('Error checking WhatsApp health', {
      error: (error as Error).message
    });
    res.status(500).json({
      service: 'whatsapp',
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
}));

export default router;
