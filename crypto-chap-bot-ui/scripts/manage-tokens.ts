import { whatsappService } from '../lib/services/whatsapp.service';
import { tokenManager } from '../lib/services/token-management.service';
import { logger } from '../lib/services/logging.service';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Creates an interface for reading user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Checks if the WhatsApp token is valid
 */
async function checkWhatsAppToken() {
  logger.info('Checking WhatsApp token validity...');
  
  const token = process.env.META_WHATSAPP_TOKEN;
  if (!token) {
    logger.warn('No WhatsApp token found in environment variables');
    return false;
  }
  
  try {
    const isValid = await whatsappService.verifyToken();
    if (isValid) {
      logger.info('WhatsApp token is valid');
    } else {
      logger.warn('WhatsApp token is invalid or expired');
    }
    return isValid;
  } catch (error) {
    logger.error('Error verifying WhatsApp token', error);
    return false;
  }
}

/**
 * Updates the WhatsApp token in environment and .env.local file
 */
async function updateWhatsAppToken(token: string) {
  logger.info('Updating WhatsApp token...');
  
  // Validate the token first
  process.env.META_WHATSAPP_TOKEN = token;
  const isValid = await whatsappService.verifyToken();
  
  if (!isValid) {
    logger.error('The provided token is invalid');
    return false;
  }
  
  // Update token in .env.local
  const success = await tokenManager.updateTokenInEnvFile(token);
  
  if (success) {
    // Store the valid token in token manager
    tokenManager.storeToken('whatsapp', token, 60);
    logger.info('WhatsApp token updated successfully');
  } else {
    logger.error('Failed to update WhatsApp token in .env.local');
  }
  
  return success;
}

/**
 * Tests the WhatsApp service by sending a test message
 */
async function testWhatsAppService(phoneNumber: string) {
  if (!phoneNumber) {
    logger.error('No phone number provided for testing');
    return false;
  }
  
  logger.info(`Sending test message to ${phoneNumber}...`);
  
  try {
    await whatsappService.sendTextMessage(
      phoneNumber, 
      '🧪 This is a test message from CryptoChap token management script'
    );
    logger.info('Test message sent successfully');
    return true;
  } catch (error) {
    logger.error('Failed to send test message', error);
    return false;
  }
}

/**
 * Displays information about the current WhatsApp setup
 */
function showWhatsAppInfo() {
  logger.info('WhatsApp Configuration Information:', {
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || 'Not set',
    verifyToken: process.env.META_VERIFY_TOKEN || 'Not set',
    appSecret: process.env.META_APP_SECRET ? '[Set]' : 'Not set',
    whatsappToken: process.env.META_WHATSAPP_TOKEN ? 
      `${process.env.META_WHATSAPP_TOKEN.substring(0, 10)}...` : 
      'Not set',
    apiVersion: process.env.META_API_VERSION || 'v18.0 (default)',
    webhookUrl: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:3000'}/api/whatsapp/webhook`
  });
}

/**
 * Main menu for the token management script
 */
async function showMenu() {
  const rl = createReadlineInterface();
  
  console.log('\n===== WhatsApp Token Management =====');
  console.log('1. Check current token validity');
  console.log('2. Update WhatsApp token');
  console.log('3. Test WhatsApp service');
  console.log('4. Show WhatsApp configuration info');
  console.log('5. Exit');
  
  const answer = await new Promise<string>(resolve => {
    rl.question('\nSelect an option: ', resolve);
  });
  
  rl.close();
  
  switch (answer) {
    case '1':
      await checkWhatsAppToken();
      await showMenu();
      break;
      
    case '2':
      const tokenRl = createReadlineInterface();
      const newToken = await new Promise<string>(resolve => {
        tokenRl.question('Enter new WhatsApp token: ', resolve);
      });
      tokenRl.close();
      
      if (newToken) {
        await updateWhatsAppToken(newToken);
      }
      await showMenu();
      break;
      
    case '3':
      const phoneRl = createReadlineInterface();
      const phoneNumber = await new Promise<string>(resolve => {
        phoneRl.question('Enter phone number for test (with country code, no +): ', resolve);
      });
      phoneRl.close();
      
      if (phoneNumber) {
        await testWhatsAppService(phoneNumber);
      }
      await showMenu();
      break;
      
    case '4':
      showWhatsAppInfo();
      await showMenu();
      break;
      
    case '5':
      console.log('Exiting...');
      process.exit(0);
      break;
      
    default:
      console.log('Invalid option');
      await showMenu();
      break;
  }
}

// Start the script
console.log('CryptoChap WhatsApp Token Management');
showMenu().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
