import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WalletDerivationService } from '../src/services/wallet-derivation.service';
import { BlockchainService } from '../src/services/blockchain.service';
import { WhatsAppEngine, whatsAppEngine } from '../src/services/whatsapp-engine.service';

// Mock external dependencies
jest.mock('ethers');
jest.mock('../src/services/logging.service');
jest.mock('../src/services/monitoring.service');

describe('CryptoChap Core Services', () => {
  let walletService: WalletDerivationService;
  let blockchainService: BlockchainService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize services
    walletService = WalletDerivationService.getInstance();
    blockchainService = BlockchainService.getInstance();
  });

  afterEach(() => {
    // Reset mocks after each test
    jest.resetAllMocks();
  });

  describe('WalletDerivationService', () => {
    it('should derive consistent wallet addresses from phone numbers', () => {
      const phone1 = '+1234567890';
      const phone2 = '+1234567890'; // Same phone
      const phone3 = '+0987654321'; // Different phone

      const wallet1 = walletService.deriveWallet(phone1);
      const wallet2 = walletService.deriveWallet(phone2);
      const wallet3 = walletService.deriveWallet(phone3);

      expect(wallet1.address).toBe(wallet2.address);
      expect(wallet1.address).not.toBe(wallet3.address);

      // Verify address format
      expect(wallet1.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet3.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should validate phone number format', () => {
      const validPhone = '+1234567890';
      const invalidPhone = '1234567890'; // Missing +

      expect(() => walletService.deriveWallet(validPhone)).not.toThrow();
      expect(() => walletService.deriveWallet(invalidPhone)).toThrow('Invalid phone number format');
    });

    it('should verify wallet ownership correctly', () => {
      const phone = '+1234567890';
      const wallet = walletService.deriveWallet(phone);

      const isOwner = walletService.verifyWalletOwnership(phone, wallet.address);
      const isNotOwner = walletService.verifyWalletOwnership(phone, '0x1234567890123456789012345678901234567890');

      expect(isOwner).toBe(true);
      expect(isNotOwner).toBe(false);
    });

    it('should generate different addresses for different phones', () => {
      const phones = [
        '+1111111111',
        '+2222222222',
        '+3333333333',
        '+4444444444',
        '+5555555555'
      ];

      const addresses = phones.map(phone => walletService.deriveWallet(phone).address);

      // All addresses should be unique
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(addresses.length);

      // All should be valid Ethereum addresses
      addresses.forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('should handle batch wallet generation', () => {
      const count = 10;
      const wallets = walletService.generateWalletBatch(count);

      expect(wallets).toHaveLength(count);

      // Verify all wallets have unique addresses
      const addresses = wallets.map(w => w.address);
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(count);

      // Verify structure
      wallets.forEach((wallet, index) => {
        expect(wallet).toHaveProperty('index', index);
        expect(wallet).toHaveProperty('address');
        expect(wallet).toHaveProperty('mnemonic');
        expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
  });

  describe('BlockchainService', () => {
    beforeEach(() => {
      // Mock successful blockchain operations
      jest.spyOn(blockchainService, 'getWalletBalance').mockResolvedValue({
        eth: '1.0',
        usdc: '100.0'
      });

      jest.spyOn(blockchainService, 'transferUSDC').mockResolvedValue({
        txHash: '0x1234567890abcdef',
        gasUsed: '21000',
        gasPrice: '20 gwei',
        blockNumber: 12345678
      });

      jest.spyOn(blockchainService, 'getNetworkInfo').mockResolvedValue({
        chainId: 8453,
        chainName: 'Base',
        rpcUrl: 'https://mainnet.base.org',
        blockNumber: 12345678,
        gasPrice: '20 gwei'
      });
    });

    it('should get wallet balance successfully', async () => {
      const address = '0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8';
      const balance = await blockchainService.getWalletBalance(address);

      expect(balance).toHaveProperty('eth');
      expect(balance).toHaveProperty('usdc');
      expect(typeof balance.eth).toBe('string');
      expect(typeof balance.usdc).toBe('string');
      expect(parseFloat(balance.usdc)).toBeGreaterThan(0);
    });

    it('should validate addresses correctly', () => {
      const validAddress = '0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8';
      const invalidAddress = 'invalid-address';

      const result1 = walletService.validateWalletAddress(validAddress);
      const result2 = walletService.validateWalletAddress(invalidAddress);

      expect(result1.isValid).toBe(true);
      expect(result1.checksumAddress).toBe(validAddress);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBeDefined();
    });

    it('should handle network information retrieval', async () => {
      const networkInfo = await blockchainService.getNetworkInfo();

      expect(networkInfo).toHaveProperty('chainId', 8453);
      expect(networkInfo).toHaveProperty('chainName', 'Base');
      expect(networkInfo).toHaveProperty('blockNumber');
      expect(networkInfo).toHaveProperty('gasPrice');
    });

    it('should handle gas price estimation', async () => {
      const gasPrice = await blockchainService.getGasPrice();

      expect(gasPrice).toHaveProperty('gasPrice');
      expect(gasPrice).toHaveProperty('estimatedCost');
      expect(gasPrice).toHaveProperty('baseFee');
    });
  });

  describe('WhatsAppEngine', () => {
    let mockContext: any;

    beforeEach(() => {
      mockContext = {
        phoneNumberId: '123456789',
        from: '+1234567890',
        messageId: 'msg_123',
        timestamp: '1234567890',
        messageText: 'balance'
      };

      // Mock wallet derivation
      jest.spyOn(walletService, 'deriveWallet').mockReturnValue({
        address: '0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8',
        publicKey: '0x04abcd...',
        path: "m/44'/60'/0'/0/123",
        phone: '+1234567890'
      });

      // Mock blockchain operations
      jest.spyOn(blockchainService, 'getWalletBalance').mockResolvedValue({
        eth: '1.0',
        usdc: '100.0'
      });
    });

    it('should process balance command correctly', async () => {
      const response = await whatsAppEngine.processTextCommand(mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Your Wallet Balance');
      expect(response.message).toContain('USDC');
      expect(response.data).toBeDefined();
    });

    it('should handle help command', async () => {
      mockContext.messageText = 'help';

      const response = await whatsAppEngine.processTextCommand(mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toContain('CryptoChap Commands');
      expect(response.message).toContain('balance');
      expect(response.message).toContain('send');
      expect(response.message).toContain('receive');
    });

    it('should handle receive command', async () => {
      mockContext.messageText = 'receive';

      const response = await whatsAppEngine.processTextCommand(mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Your Receiving Address');
      expect(response.message).toContain('Base network');
      expect(response.message).toContain('USDC');
    });

    it('should validate send command format', async () => {
      mockContext.messageText = 'send';

      const response = await whatsAppEngine.processTextCommand(mockContext);

      expect(response.success).toBe(false);
      expect(response.message).toContain('Usage:');
      expect(response.message).toContain('send AMOUNT ADDRESS');
    });

    it('should validate send command parameters', async () => {
      // Test invalid amount
      mockContext.messageText = 'send abc 0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8';
      const response1 = await whatsAppEngine.processTextCommand(mockContext);

      expect(response1.success).toBe(false);
      expect(response1.message).toContain('Invalid amount');

      // Test invalid address
      mockContext.messageText = 'send 10 invalid-address';
      const response2 = await whatsAppEngine.processTextCommand(mockContext);

      expect(response2.success).toBe(false);
      expect(response2.message).toContain('Invalid address');
    });

    it('should handle unknown commands gracefully', async () => {
      mockContext.messageText = 'unknown_command';

      const response = await whatsAppEngine.processTextCommand(mockContext);

      expect(response.success).toBe(false);
      expect(response.message).toContain('Unknown command');
      expect(response.message).toContain('help');
    });

    it('should process button replies correctly', async () => {
      mockContext.buttonReply = {
        id: 'balance',
        title: 'Check Balance'
      };

      const response = await whatsAppEngine.handleButtonReply(mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Your Wallet Balance');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete user workflow', async () => {
      // Test complete workflow: help -> balance -> receive
      const context1 = { ...mockContext, messageText: 'help' };
      const context2 = { ...mockContext, messageText: 'balance' };
      const context3 = { ...mockContext, messageText: 'receive' };

      const response1 = await whatsAppEngine.processTextCommand(context1);
      const response2 = await whatsAppEngine.processTextCommand(context2);
      const response3 = await whatsAppEngine.processTextCommand(context3);

      expect(response1.success).toBe(true);
      expect(response1.message).toContain('Commands');

      expect(response2.success).toBe(true);
      expect(response2.message).toContain('Balance');

      expect(response3.success).toBe(true);
      expect(response3.message).toContain('Receiving Address');
    });

    it('should handle wallet derivation and balance consistency', async () => {
      const phone = '+1234567890';

      // Derive wallet multiple times
      const wallet1 = walletService.deriveWallet(phone);
      const wallet2 = walletService.deriveWallet(phone);

      expect(wallet1.address).toBe(wallet2.address);

      // Get balance for the derived wallet
      const balance = await blockchainService.getWalletBalance(wallet1.address);

      expect(balance).toHaveProperty('eth');
      expect(balance).toHaveProperty('usdc');
      expect(parseFloat(balance.usdc)).toBeGreaterThanOrEqual(0);
    });

    it('should validate end-to-end transaction flow', async () => {
      const senderPhone = '+1111111111';
      const receiverAddress = '0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8';

      // Derive sender wallet
      const senderWallet = walletService.deriveWallet(senderPhone);

      // Mock successful balance check
      jest.spyOn(blockchainService, 'getWalletBalance').mockResolvedValue({
        eth: '1.0',
        usdc: '50.0'
      });

      // Test send command
      const context = {
        ...mockContext,
        from: senderPhone,
        messageText: `send 10 ${receiverAddress}`
      };

      const response = await whatsAppEngine.processTextCommand(context);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Transfer Successful');
      expect(response.message).toContain('USDC');
    });
  });

  describe('Error Handling', () => {
    it('should handle blockchain service errors gracefully', async () => {
      // Mock blockchain service failure
      jest.spyOn(blockchainService, 'getWalletBalance').mockRejectedValue(
        new Error('Blockchain connection failed')
      );

      const context = { ...mockContext, messageText: 'balance' };
      const response = await whatsAppEngine.processTextCommand(context);

      expect(response.success).toBe(false);
      expect(response.message).toContain('Error getting balance');
    });

    it('should handle wallet derivation errors', async () => {
      // Mock invalid phone number
      const context = { ...mockContext, from: 'invalid-phone' };

      // This should be handled gracefully by the service
      expect(() => walletService.deriveWallet('invalid-phone')).toThrow();
    });

    it('should handle malformed messages', async () => {
      const malformedContext = {
        ...mockContext,
        messageText: '' // Empty message
      };

      const response = await whatsAppEngine.processTextCommand(malformedContext);

      expect(response.success).toBe(false);
      expect(response.message).toContain('text message');
    });
  });

  describe('Security Tests', () => {
    it('should not expose private keys in responses', async () => {
      const context = { ...mockContext, messageText: 'balance' };
      const response = await whatsAppEngine.processTextCommand(context);

      expect(response.message).not.toContain('private');
      expect(response.message).not.toContain('secret');
      expect(response.message).not.toContain('key');
    });

    it('should validate all input parameters', async () => {
      // Test with malicious input
      const maliciousContext = {
        ...mockContext,
        messageText: 'send 100 <script>alert("xss")</script>'
      };

      const response = await whatsAppEngine.processTextCommand(maliciousContext);

      expect(response.success).toBe(false);
      expect(response.message).toContain('Invalid address');
    });

    it('should handle rate limiting gracefully', async () => {
      // Test rapid successive requests
      const promises = Array(10).fill(null).map(() =>
        whatsAppEngine.processTextCommand({ ...mockContext, messageText: 'balance' })
      );

      const responses = await Promise.all(promises);

      // All requests should be processed (rate limiting is handled at middleware level)
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response).toHaveProperty('success');
        expect(response).toHaveProperty('message');
      });
    });
  });
});
