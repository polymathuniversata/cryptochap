import { ethers } from 'ethers';

/**
 * WhatsApp message types and interfaces
 */
interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

interface MessageContext {
  phoneNumberId: string;
  from: string;
  messageId: string;
  timestamp: string;
  messageText?: string;
  buttonReply?: {
    id: string;
    title: string;
  };
}

interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
  action?: string;
  requiresConfirmation?: boolean;
  confirmationData?: any;
}

/**
 * WhatsApp Message Processing Engine
 * Handles incoming WhatsApp messages and processes crypto commands
 */
export class WhatsAppEngine {
  private static instance: WhatsAppEngine;
  private commandHandlers: Map<string, (context: MessageContext, args: string[]) => Promise<CommandResponse>>;

  private constructor() {
    this.initializeCommandHandlers();
  }

  public static getInstance(): WhatsAppEngine {
    if (!WhatsAppEngine.instance) {
      WhatsAppEngine.instance = new WhatsAppEngine();
    }
    return WhatsAppEngine.instance;
  }

  /**
   * Initialize command handlers
   */
  private initializeCommandHandlers(): void {
    this.commandHandlers = new Map();

    // Balance command
    this.commandHandlers.set('balance', this.handleBalanceCommand.bind(this));
    this.commandHandlers.set('bal', this.handleBalanceCommand.bind(this));

    // Send command
    this.commandHandlers.set('send', this.handleSendCommand.bind(this));
    this.commandHandlers.set('transfer', this.handleSendCommand.bind(this));

    // Receive command
    this.commandHandlers.set('receive', this.handleReceiveCommand.bind(this));
    this.commandHandlers.set('address', this.handleReceiveCommand.bind(this));

    // Help command
    this.commandHandlers.set('help', this.handleHelpCommand.bind(this));

    // Status command
    this.commandHandlers.set('status', this.handleStatusCommand.bind(this));
    this.commandHandlers.set('check', this.handleStatusCommand.bind(this));

    // Wallet info command
    this.commandHandlers.set('wallet', this.handleWalletCommand.bind(this));
    this.commandHandlers.set('info', this.handleWalletCommand.bind(this));

    // Network info command
    this.commandHandlers.set('network', this.handleNetworkCommand.bind(this));
    this.commandHandlers.set('gas', this.handleNetworkCommand.bind(this));
  }

  /**
   * Process incoming WhatsApp webhook
   */
  public async processWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let success = false;

    try {
      const payload: WhatsAppWebhookPayload = req.body;

      // Validate webhook payload
      if (!this.isValidWebhookPayload(payload)) {
        logger.warn('Invalid webhook payload received', { payload });
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      // Process all messages in the webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              await this.processMessage(change.value, message);
            }
          }
        }
      }

      success = true;
      res.status(200).json({ status: 'ok' });

    } catch (error) {
      logger.error('Error processing WhatsApp webhook', {
        error: (error as Error).message,
        body: req.body
      });
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      monitoring.trackDbQuery('processWebhook', Date.now() - startTime, success);
    }
  }

  /**
   * Process individual message
   */
  private async processMessage(
    value: WhatsAppWebhookPayload['entry'][0]['changes'][0]['value'],
    message: WhatsAppWebhookPayload['entry'][0]['changes'][0]['value']['messages'][0]
  ): Promise<void> {
    try {
      const context: MessageContext = {
        phoneNumberId: value.metadata.phone_number_id,
        from: message.from,
        messageId: message.id,
        timestamp: message.timestamp,
        messageText: message.text?.body,
        buttonReply: message.interactive?.button_reply
      };

      // Get user contact info
      const contact = value.contacts?.[0];
      const userName = contact?.profile?.name || 'Unknown User';

      logger.info('Processing WhatsApp message', {
        from: context.from,
        userName,
        messageId: context.messageId,
        hasText: !!context.messageText,
        hasButtonReply: !!context.buttonReply
      });

      let response: CommandResponse;

      // Handle button replies
      if (context.buttonReply) {
        response = await this.handleButtonReply(context);
      }
      // Handle text messages
      else if (context.messageText) {
        response = await this.processTextCommand(context);
      }
      // Handle other message types
      else {
        response = {
          success: false,
          message: 'Unsupported message type. Please send a text message or use the interactive buttons.'
        };
      }

      // Send response back to WhatsApp
      if (response.message) {
        await this.sendWhatsAppMessage(context.from, response.message, response);
      }

      monitoring.incrementMetric('whatsapp.message_processed');

    } catch (error) {
      logger.error('Error processing individual message', {
        messageId: message.id,
        from: message.from,
        error: (error as Error).message
      });
    }
  }

  /**
   * Process text commands
   */
  private async processTextCommand(context: MessageContext): Promise<CommandResponse> {
    const { messageText } = context;

    if (!messageText) {
      return {
        success: false,
        message: 'Please send a text message with your command.'
      };
    }

    // Parse command and arguments
    const parts = messageText.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const handler = this.commandHandlers.get(command);

    if (!handler) {
      return {
        success: false,
        message: this.getUnknownCommandMessage(command)
      };
    }

    try {
      return await handler(context, args);
    } catch (error) {
      logger.error('Error executing command', {
        command,
        args,
        error: (error as Error).message
      });

      return {
        success: false,
        message: `Error executing command: ${(error as Error).message}`
      };
    }
  }

  /**
   * Handle button reply interactions
   */
  private async handleButtonReply(context: MessageContext): Promise<CommandResponse> {
    const { buttonReply } = context;

    if (!buttonReply) {
      return {
        success: false,
        message: 'Invalid button interaction.'
      };
    }

    switch (buttonReply.id) {
      case 'help':
        return this.handleHelpCommand(context, []);
      case 'balance':
        return this.handleBalanceCommand(context, []);
      case 'receive':
        return this.handleReceiveCommand(context, []);
      case 'send':
        return {
          success: false,
          message: 'Please use the text command: "send AMOUNT ADDRESS" to transfer funds.',
          action: 'prompt_send'
        };
      case 'status':
        return this.handleStatusCommand(context, []);
      default:
        return {
          success: false,
          message: 'Unknown button action. Type "help" for available commands.'
        };
    }
  }

  /**
   * Balance command handler
   */
  private async handleBalanceCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    try {
      // Derive wallet address from phone number
      const walletInfo = walletDerivationService.deriveWallet(context.from);

      // Get balance from blockchain
      const balance = await blockchainService.getWalletBalance(walletInfo.address);

      const message = `💰 *Your Wallet Balance*\n\n` +
        `📍 Address: \`${walletInfo.address}\`\n` +
        `💎 ETH: ${parseFloat(balance.eth).toFixed(4)} ETH\n` +
        `💰 USDC: ${parseFloat(balance.usdc).toFixed(2)} USDC\n\n` +
        `To send USDC: \`send AMOUNT ADDRESS\`\n` +
        `To receive: \`receive\``;

      return {
        success: true,
        message,
        data: balance
      };

    } catch (error) {
      return {
        success: false,
        message: `Error getting balance: ${(error as Error).message}`
      };
    }
  }

  /**
   * Send command handler
   */
  private async handleSendCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    if (args.length < 2) {
      return {
        success: false,
        message: 'Usage: `send AMOUNT ADDRESS`\n\nExample: `send 10 0x1234...abcd`',
        requiresConfirmation: true,
        confirmationData: {
          command: 'send',
          amount: args[0],
          address: args[1]
        }
      };
    }

    const [amountStr, toAddress] = args;

    // Validate amount
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: 'Invalid amount. Please specify a positive number.'
      };
    }

    // Validate address
    if (!ethers.isAddress(toAddress)) {
      return {
        success: false,
        message: `Invalid address format: ${toAddress}`
      };
    }

    try {
      // Derive sender wallet
      const fromWallet = walletDerivationService.deriveWallet(context.from);

      // Check balance first
      const balance = await blockchainService.getWalletBalance(fromWallet.address);
      if (parseFloat(balance.usdc) < amount) {
        return {
          success: false,
          message: `Insufficient balance. You have ${parseFloat(balance.usdc).toFixed(2)} USDC but trying to send ${amount} USDC.`
        };
      }

      // Execute transfer
      const txResult = await blockchainService.transferUSDC(
        fromWallet.address,
        toAddress,
        amount.toString()
      );

      const message = `✅ *Transfer Successful!*\n\n` +
        `💰 Amount: ${amount} USDC\n` +
        `📤 From: \`${fromWallet.address}\`\n` +
        `📥 To: \`${toAddress}\`\n` +
        `🔗 TX: \`${txResult.txHash}\`\n` +
        `⛽ Gas Used: ${txResult.gasUsed}\n\n` +
        `Your new balance: ${parseFloat(balance.usdc).toFixed(2)} USDC`;

      return {
        success: true,
        message,
        data: txResult
      };

    } catch (error) {
      return {
        success: false,
        message: `Transfer failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Receive command handler
   */
  private async handleReceiveCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    try {
      const walletInfo = walletDerivation.deriveWalletFromPhone(context.from);

      const message = `📥 *Your Receiving Address*\n\n` +
        `Send USDC to this address:\n` +
        `\`${walletInfo.address}\`\n\n` +
        `⚠️ *Important:* Only send USDC on Base network. Other tokens or networks may result in permanent loss.`;

      return {
        success: true,
        message,
        data: {
          address: walletInfo.address,
          network: 'Base',
          token: 'USDC'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error getting address: ${(error as Error).message}`
      };
    }
  }

  /**
   * Help command handler
   */
  private async handleHelpCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    const message = `🤖 *CryptoChap Commands*\n\n` +
      `💰 *balance* - Check your wallet balance\n` +
      `📤 *send AMOUNT ADDRESS* - Send USDC to an address\n` +
      `📥 *receive* - Get your receiving address\n` +
      `🔍 *status* - Check transaction status\n` +
      `ℹ️ *wallet* - Get wallet information\n` +
      `⛽ *gas* - Check network gas fees\n` +
      `❓ *help* - Show this help message\n\n` +
      `💡 *Tips:*\n` +
      `• Use exact amounts (e.g., 10.50)\n` +
      `• Double-check addresses before sending\n` +
      `• Only USDC on Base network is supported`;

    return {
      success: true,
      message
    };
  }

  /**
   * Status command handler
   */
  private async handleStatusCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    try {
      // Get network information
      const networkInfo = await blockchainService.getNetworkInfo();
      const gasPrice = await blockchainService.getGasPrice();

      const message = `📊 *Network Status*\n\n` +
        `🌐 Network: ${networkInfo.chainName}\n` +
        `🔗 Chain ID: ${networkInfo.chainId}\n` +
        `📦 Block: ${networkInfo.blockNumber}\n` +
        `⛽ Gas Price: ${gasPrice.gasPrice}\n` +
        `💰 Est. Cost: ${gasPrice.estimatedCost}\n\n` +
        `✅ System operational`;

      return {
        success: true,
        message,
        data: { networkInfo, gasPrice }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error checking status: ${(error as Error).message}`
      };
    }
  }

  /**
   * Wallet command handler
   */
  private async handleWalletCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    try {
      const walletInfo = walletDerivation.deriveWalletFromPhone(context.from);
      const balance = await blockchainService.getWalletBalance(walletInfo.address);

      const message = `📱 *Wallet Information*\n\n` +
        `🔑 Address: \`${walletInfo.address}\`\n` +
        `💰 Balance: ${parseFloat(balance.usdc).toFixed(2)} USDC\n` +
        `⛓️ Network: Base\n` +
        `🛡️ Secure: Yes\n\n` +
        `This wallet is derived from your phone number for security.`;

      return {
        success: true,
        message,
        data: { walletInfo, balance }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error getting wallet info: ${(error as Error).message}`
      };
    }
  }

  /**
   * Network command handler
   */
  private async handleNetworkCommand(context: MessageContext, args: string[]): Promise<CommandResponse> {
    try {
      const networkInfo = await blockchainService.getNetworkInfo();
      const gasPrice = await blockchainService.getGasPrice();

      const message = `⛓️ *Base Network Info*\n\n` +
        `🔗 Chain: ${networkInfo.chainName} (${networkInfo.chainId})\n` +
        `📦 Latest Block: ${networkInfo.blockNumber}\n` +
        `⛽ Current Gas: ${gasPrice.gasPrice}\n` +
        `💰 Avg Transfer Cost: ${gasPrice.estimatedCost}\n` +
        `🌐 RPC: ${networkInfo.rpcUrl}\n\n` +
        `Base is Ethereum's Layer 2 network for fast, low-cost transactions.`;

      return {
        success: true,
        message,
        data: { networkInfo, gasPrice }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error getting network info: ${(error as Error).message}`
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsAppMessage(
    to: string,
    message: string,
    response?: CommandResponse
  ): Promise<void> {
    try {
      // In a real implementation, this would use the WhatsApp Business API
      // For now, we'll just log the message
      logger.info('WhatsApp message to send', {
        to,
        message: message.substring(0, 100) + '...',
        responseType: response?.action || 'standard'
      });

      // TODO: Implement actual WhatsApp API call
      // const whatsappApiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
      // await axios.post(whatsappApiUrl, {
      //   messaging_product: 'whatsapp',
      //   to,
      //   type: 'text',
      //   text: { body: message }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

    } catch (error) {
      logger.error('Error sending WhatsApp message', {
        to,
        error: (error as Error).message
      });
    }
  }

  /**
   * Validate webhook payload structure
   */
  private isValidWebhookPayload(payload: WhatsAppWebhookPayload): boolean {
    return (
      payload &&
      payload.object === 'whatsapp_business_account' &&
      Array.isArray(payload.entry) &&
      payload.entry.length > 0 &&
      Array.isArray(payload.entry[0].changes) &&
      payload.entry[0].changes.length > 0
    );
  }

  /**
   * Get unknown command message
   */
  private getUnknownCommandMessage(command: string): string {
    return `❓ Unknown command: "${command}"\n\n` +
      `Type "help" to see available commands, or try:\n` +
      `• "balance" - Check your balance\n` +
      `• "send 10 0x123..." - Send USDC\n` +
      `• "receive" - Get your address`;
  }
}

// Export singleton instance
export const whatsAppEngine = WhatsAppEngine.getInstance();
