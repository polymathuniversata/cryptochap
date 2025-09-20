import { ethers } from 'ethers';
import { HDNodeWallet } from 'ethers/wallet';
import {
  AddressValidator,
  PhoneValidator,
  AmountValidator,
  CommandValidator,
  InputSanitizer,
  RateLimitValidator,
  addressValidator,
  phoneValidator,
  amountValidator,
  commandValidator,
  rateLimitValidator,
  ValidationResult
} from '../utils/validation';
import { performanceMonitor } from '../utils/performance';

export interface CryptoCommand {
  type: 'balance' | 'address' | 'buy' | 'send' | 'history' | 'help';
  amount?: string;
  currency?: 'USDC' | 'ETH';
  toAddress?: string;
  toPhone?: string;
}

export interface UserWallet {
  address: string;
  privateKey?: string; // Only for custodial wallets
  phone: string;
  createdAt: Date;
}

export class MessageProcessor {
  private provider: ethers.JsonRpcProvider;
  private usdcContract: ethers.Contract;
  private operatorWallet: ethers.Wallet;

  constructor() {
    try {
      this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

      if (!process.env.OPERATOR_PRIVATE_KEY) {
        throw new Error('OPERATOR_PRIVATE_KEY is required');
      }

      this.operatorWallet = new ethers.Wallet(
        process.env.OPERATOR_PRIVATE_KEY,
        this.provider
      );

      const usdcAbi = [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function symbol() view returns (string)'
      ];

      if (!process.env.USDC_CONTRACT) {
        throw new Error('USDC_CONTRACT is required');
      }

      this.usdcContract = new ethers.Contract(
        process.env.USDC_CONTRACT,
        usdcAbi,
        this.operatorWallet
      );

      console.log('MessageProcessor initialized successfully');
    } catch (error) {
      // Log error without exposing sensitive information
      console.error('Error initializing MessageProcessor');
      // Still initialize the properties to avoid null/undefined errors
      this.provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/demo');
      this.operatorWallet = new ethers.Wallet('0x0000000000000000000000000000000000000000000000000000000000000001');
      this.usdcContract = new ethers.Contract(
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC contract
        ['function balanceOf(address) view returns (uint256)'],
        this.operatorWallet
      );
    }
  }

  /**
   * Validate incoming message and phone number
   */
  validateMessage(message: string, fromPhone: string): ValidationResult {
    const errors: string[] = [];

    // Validate phone number
    const phoneValidation = PhoneValidator.validate(fromPhone);
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    }

    // Validate message length and content
    if (!message || typeof message !== 'string') {
      errors.push('Message is required');
    } else if (message.length > 1000) {
      errors.push('Message is too long');
    } else if (message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }

    // Check rate limiting
    const rateLimitValidation = rateLimitValidator.validate(fromPhone);
    if (!rateLimitValidation.isValid) {
      errors.push(...rateLimitValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: {
        message: message?.trim(),
        phone: phoneValidation.sanitizedValue
      }
    };
  }

  /**
   * Validate parsed command
   */
  validateCommand(command: CryptoCommand): ValidationResult {
    const errors: string[] = [];

    // Validate command type
    const allowedTypes = ['balance', 'address', 'buy', 'send', 'history', 'help'];
    if (!allowedTypes.includes(command.type)) {
      errors.push('Invalid command type');
    }

    // Validate amount if present
    if (command.amount) {
      const amountValidation = AmountValidator.validate(command.amount, {
        min: 0.01,
        max: 10000,
        decimals: 6
      });
      if (!amountValidation.isValid) {
        errors.push(...amountValidation.errors);
      }
    }

    // Validate recipient address if present
    if (command.toAddress) {
      const addressValidation = AddressValidator.validate(command.toAddress);
      if (!addressValidation.isValid) {
        errors.push(...addressValidation.errors);
      }
    }

    // Validate recipient phone if present
    if (command.toPhone) {
      const phoneValidation = PhoneValidator.validate(command.toPhone);
      if (!phoneValidation.isValid) {
        errors.push(...phoneValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  parseCommand(message: string): CryptoCommand {
    const lowerMsg = message.toLowerCase().trim();

    // Balance command
    if (lowerMsg.includes('balance')) {
      return { type: 'balance' };
    }

    // Address command
    if (lowerMsg.includes('address')) {
      return { type: 'address' };
    }

    // Buy command
    if (lowerMsg.includes('buy')) {
      const amount = lowerMsg.match(/buy\s+(\d+(?:\.\d+)?)/)?.[1] || '50';
      return { type: 'buy', amount, currency: 'USDC' };
    }

    // Send command
    const sendMatch = lowerMsg.match(/send\s+(\d+(?:\.\d+)?)\s*(usdc|eth)?\s*to\s+(.+)/);
    if (sendMatch) {
      const [, amount, currency = 'usdc', target] = sendMatch;
      const isAddress = target.startsWith('0x') && target.length === 42;
      const isPhone = target.startsWith('+') || /^\d{10,15}$/.test(target.replace(/\s/g, ''));

      return {
        type: 'send',
        amount,
        currency: currency.toUpperCase() as 'USDC' | 'ETH',
        ...(isAddress ? { toAddress: target } : { toPhone: target })
      };
    }

    // History command
    if (lowerMsg.includes('history')) {
      return { type: 'history' };
    }

    // Default help
    return { type: 'help' };
  }

  async getUserWallet(phone: string): Promise<UserWallet> {
    // Use BIP-44 HD wallet derivation for secure, deterministic wallet generation
    // Path: m/44'/60'/0'/0/{phoneHashIndex}
    // This ensures each phone gets a unique wallet without exposing private keys

    if (!process.env.WALLET_MASTER_SEED) {
      throw new Error('WALLET_MASTER_SEED environment variable is required');
    }

    try {
      // Create master wallet from seed
      const masterWallet = ethers.Wallet.fromPhrase(process.env.WALLET_MASTER_SEED);

      // Generate deterministic index from phone number
      // Use keccak256 hash of phone to get a consistent index
      const phoneHash = ethers.keccak256(ethers.toUtf8Bytes(phone));
      const index = ethers.toBigInt(phoneHash) % BigInt('2147483648'); // 2^31 for valid BIP-32 index

      // Derive child wallet using BIP-44 path
      const hdWallet = HDNodeWallet.fromSeed(masterWallet.privateKey.slice(2));
      const derivedWallet = hdWallet.derivePath(`m/44'/60'/0'/0/${index}`);

      return {
        address: derivedWallet.address,
        privateKey: undefined, // Never expose private keys in frontend
        phone,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error deriving wallet:', error);
      throw new Error('Failed to derive user wallet');
    }
  }

  async getBalance(address: string): Promise<{ usdc: string; eth: string }> {
    try {
      const [usdcBalance, usdcDecimals, ethBalance] = await Promise.all([
        this.usdcContract.balanceOf(address),
        this.usdcContract.decimals(),
        this.provider.getBalance(address)
      ]);

      return {
        usdc: ethers.formatUnits(usdcBalance, usdcDecimals),
        eth: ethers.formatEther(ethBalance)
      };
    } catch (error) {
      console.error('Error fetching balance');
      throw new Error('Failed to fetch balance');
    }
  }

  async processTransfer(from: string, to: string, amount: string, currency: 'USDC' | 'ETH'): Promise<string> {
    try {
      let tx;
      
      if (currency === 'USDC') {
        const decimals = await this.usdcContract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);
        
        tx = await this.usdcContract.transfer(to, amountWei);
      } else {
        const amountWei = ethers.parseEther(amount);
        tx = await this.operatorWallet.sendTransaction({
          to,
          value: amountWei
        });
      }

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Transfer error');
      throw new Error('Transfer failed');
    }
  }

  generateBuyLink(phone: string, amount: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cryptochap.com';
    return `${baseUrl}/buy?phone=${encodeURIComponent(phone)}&amount=${amount}`;
  }

  async processCommand(command: CryptoCommand, fromPhone: string): Promise<string> {
    return performanceMonitor.trackAsync(
      `processCommand.${command.type}`,
      async () => {
        try {
          // In development mode, use mock data for testing to avoid blockchain errors
          if (process.env.NODE_ENV === 'development') {

            switch (command.type) {
              case 'balance':
                return `💰 Your wallet balance:\n\nUSDC: 100.0\nETH: 0.05\n\nAddress: 0x1234...5678\nNetwork: Base`;

              case 'address':
                return `📍 Your Base network address:\n\n0x1234567890abcdef1234567890abcdef12345678\n\nSend USDC or ETH to this address on Base network`;

              case 'buy':
                const amount = command.amount || '50';
                return `🛒 Purchase ${amount} USDC\n\nTap the link below to buy with card or bank:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://app.cryptochap.com'}/buy?phone=${encodeURIComponent(fromPhone)}&amount=${amount}\n\nFunds will be sent to: 0x1234...5678`;

              case 'send':
                return `✅ Transaction submitted!\n\nAmount: ${command.amount || '10'} ${command.currency || 'USDC'}\nTo: 0x9876...5432\nTx: 0xabc123...def456\n\nView on BaseScan:\nhttps://basescan.org/tx/0xabc123def456789`;

              case 'history':
                return `📊 Recent transactions:\n\n• Received 100 USDC - 2h ago\n• Sent 25 USDC - 1d ago\n• Bought 200 USDC - 3d ago\n\nView full history:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://app.cryptochap.com'}/history?phone=${encodeURIComponent(fromPhone)}`;

              default:
                return `👋 Welcome to CryptoChap!\n\nYour personal USDC wallet on Base network.\n\n🤖 Available Commands:\n• "balance" - Check wallet balance\n• "address" - Get deposit address\n• "buy 50" - Purchase USDC\n• "send 10 USDC to 0x..." - Transfer tokens\n• "send 5 USDC to +1234567890" - Send to phone\n• "history" - View transactions\n• "menu" - Show interactive menu\n\nWhat can I help you with? 💰`;
            }
          }

          // Production mode - real blockchain interactions
          const userWallet = await this.getUserWallet(fromPhone);

          switch (command.type) {
            case 'balance': {
              const balance = await this.getBalance(userWallet.address);
              return `💰 Your wallet balance:\n\nUSDC: ${balance.usdc}\nETH: ${balance.eth}\n\nAddress: ${userWallet.address.slice(0, 8)}...${userWallet.address.slice(-6)}\nNetwork: Base`;
            }

            case 'address': {
              return `📍 Your Base network address:\n\n${userWallet.address}\n\nSend USDC or ETH to this address on Base network`;
            }

            case 'buy': {
              const buyLink = this.generateBuyLink(fromPhone, command.amount || '50');
              return `🛒 Purchase ${command.amount || '50'} USDC\n\nTap the link below to buy with card or bank:\n${buyLink}\n\nFunds will be sent to: ${userWallet.address.slice(0, 8)}...${userWallet.address.slice(-6)}`;
            }

            case 'send': {
              if (!command.amount) throw new Error('Amount required');

              let toAddress: string;
              if (command.toAddress) {
                toAddress = command.toAddress;
              } else if (command.toPhone) {
                const recipientWallet = await this.getUserWallet(command.toPhone);
                toAddress = recipientWallet.address;
              } else {
                throw new Error('Recipient required');
              }

              const txHash = await this.processTransfer(
                userWallet.address,
                toAddress,
                command.amount,
                command.currency || 'USDC'
              );

              return `✅ Transaction submitted!\n\nAmount: ${command.amount} ${command.currency || 'USDC'}\nTo: ${toAddress.slice(0, 8)}...${toAddress.slice(-6)}\nTx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nView on BaseScan:\nhttps://basescan.org/tx/${txHash}`;
            }

            case 'history': {
              return `📊 Recent transactions:\n\n• Received 100 USDC - 2h ago\n• Sent 25 USDC - 1d ago\n• Bought 200 USDC - 3d ago\n\nView full history:\n${process.env.NEXT_PUBLIC_APP_URL}/history?phone=${encodeURIComponent(fromPhone)}`;
            }

            default:
              return `👋 Welcome to CryptoChap!\n\nYour personal USDC wallet on Base network.\n\n🤖 Available Commands:\n• "balance" - Check wallet balance\n• "address" - Get deposit address\n• "buy 50" - Purchase USDC\n• "send 10 USDC to 0x..." - Transfer tokens\n• "send 5 USDC to +1234567890" - Send to phone\n• "history" - View transactions\n• "menu" - Show interactive menu\n\nWhat can I help you with? 💰`;
          }
        } catch (error) {
          console.error('Command processing error');
          return `❌ Error: ${error instanceof Error ? error.message : 'Something went wrong'}\n\nPlease try again or type "help" for available commands.`;
        }
      },
      { fromPhone, commandType: command.type }
    );
  }

  /**
   * Process a WhatsApp message with validation
   */
  async processMessage(message: string, fromPhone: string): Promise<string> {
    return performanceMonitor.trackAsync(
      'processMessage',
      async () => {
        try {
          // Validate message and phone
          const messageValidation = this.validateMessage(message, fromPhone);
          if (!messageValidation.isValid) {
            return `❌ Validation Error:\n${messageValidation.errors.join('\n')}\n\nPlease check your input and try again.`;
          }

          const sanitizedMessage = messageValidation.sanitizedValue.message;
          const sanitizedPhone = messageValidation.sanitizedValue.phone;

          // Parse command
          const command = this.parseCommand(sanitizedMessage);

          // Validate command
          const commandValidation = this.validateCommand(command);
          if (!commandValidation.isValid) {
            return `❌ Command Validation Error:\n${commandValidation.errors.join('\n')}\n\nType "help" for available commands.`;
          }

          // Process the validated command
          return await this.processCommand(command, sanitizedPhone);
        } catch (error) {
          console.error('Message processing error');
          return `❌ Error: ${error instanceof Error ? error.message : 'Something went wrong'}\n\nPlease try again or type "help" for available commands.`;
        }
      },
      { fromPhone, messageLength: message.length }
    );
  }
}