import { ethers } from 'ethers';
import { logger } from '../services/logging.service';
import { monitoring } from '../services/monitoring.service';

/**
 * Blockchain service for Base network operations
 * Handles USDC transfers, wallet management, and blockchain interactions
 */
export class BlockchainService {
  private static instance: BlockchainService;
  private provider!: ethers.JsonRpcProvider;
  private operatorWallet!: ethers.Wallet;
  private usdcContract!: ethers.Contract;
  private readonly usdcContractAddress: string;
  private readonly baseRpcUrl: string;
  private readonly baseChainId: number;

  private constructor() {
    this.baseRpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    this.baseChainId = parseInt(process.env.BASE_CHAIN_ID || '8453');
    this.usdcContractAddress = process.env.USDC_CONTRACT || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

    this.initializeBlockchainConnection();
  }

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  /**
   * Initialize blockchain connection
   */
  private initializeBlockchainConnection(): void {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.baseRpcUrl);

      // Initialize operator wallet
      const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
      if (!operatorPrivateKey) {
        throw new Error('OPERATOR_PRIVATE_KEY environment variable is required');
      }

      this.operatorWallet = new ethers.Wallet(operatorPrivateKey, this.provider);

      // Initialize USDC contract
      const usdcAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function totalSupply() view returns (uint256)'
      ];

      this.usdcContract = new ethers.Contract(
        this.usdcContractAddress,
        usdcAbi,
        this.operatorWallet
      );

      logger.info('Blockchain connection initialized', {
        network: 'Base',
        rpcUrl: this.baseRpcUrl,
        operatorAddress: this.operatorWallet.address,
        usdcContract: this.usdcContractAddress
      });

    } catch (error) {
      logger.error('Failed to initialize blockchain connection', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get wallet balance for a specific token
   */
  public async getWalletBalance(address: string, tokenAddress?: string): Promise<{
    eth: string;
    usdc: string;
    token?: string;
  }> {
    const startTime = Date.now();
    let success = false;

    try {
      // Get ETH balance
      const ethBalance = await this.provider.getBalance(address);
      const ethBalanceFormatted = ethers.formatEther(ethBalance);

      // Get USDC balance
      let usdcBalance = '0';
      let tokenBalance = '0';

      try {
        const usdcBalanceRaw = await this.usdcContract.balanceOf(address);
        const usdcDecimals = await this.usdcContract.decimals();
        usdcBalance = ethers.formatUnits(usdcBalanceRaw, usdcDecimals);
      } catch (error) {
        logger.warn('Failed to get USDC balance', {
          address,
          error: (error as Error).message
        });
      }

      // Get custom token balance if specified
      if (tokenAddress && tokenAddress !== this.usdcContractAddress) {
        try {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
            this.provider
          );
          const tokenBalanceRaw = await tokenContract.balanceOf(address);
          const tokenDecimals = await tokenContract.decimals();
          tokenBalance = ethers.formatUnits(tokenBalanceRaw, tokenDecimals);
        } catch (error) {
          logger.warn('Failed to get token balance', {
            address,
            tokenAddress,
            error: (error as Error).message
          });
        }
      }

      success = true;

      const result = {
        eth: ethBalanceFormatted,
        usdc: usdcBalance,
        token: tokenAddress !== this.usdcContractAddress ? tokenBalance : undefined
      };

      monitoring.trackDbQuery('getWalletBalance', Date.now() - startTime, success);

      return result;

    } catch (error) {
      monitoring.trackDbQuery('getWalletBalance', Date.now() - startTime, false);
      logger.error('Failed to get wallet balance', {
        address,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Transfer USDC tokens
   */
  public async transferUSDC(
    fromAddress: string,
    toAddress: string,
    amount: string,
    gasLimit?: string
  ): Promise<{
    txHash: string;
    gasUsed: string;
    gasPrice: string;
    blockNumber: number;
  }> {
    const startTime = Date.now();
    let success = false;

    try {
      // Validate addresses
      if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
        throw new Error('Invalid address format');
      }

      // Parse amount
      const usdcDecimals = await this.usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount, usdcDecimals);

      // Check balance
      const balance = await this.usdcContract.balanceOf(fromAddress);
      if (balance < amountWei) {
        throw new Error('Insufficient USDC balance');
      }

      // Estimate gas
      const gasEstimate = await this.usdcContract.transfer.estimateGas(
        toAddress,
        amountWei
      );

      const gasLimitToUse = gasLimit || (gasEstimate * BigInt(120) / BigInt(100)); // 20% buffer

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Execute transfer
      const tx = await this.usdcContract.transfer(toAddress, amountWei, {
        gasLimit: gasLimitToUse,
        gasPrice: gasPrice
      });

      logger.info('USDC transfer initiated', {
        txHash: tx.hash,
        from: fromAddress,
        to: toAddress,
        amount: amount,
        gasLimit: gasLimitToUse.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }

      success = true;

      const result = {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
        blockNumber: receipt.blockNumber
      };

      monitoring.trackBlockchainTransaction(tx.hash, 'base', success);

      logger.info('USDC transfer completed', {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      });

      return result;

    } catch (error) {
      monitoring.trackBlockchainTransaction('unknown', 'base', false);
      monitoring.trackDbQuery('transferUSDC', Date.now() - startTime, false);

      logger.error('USDC transfer failed', {
        from: fromAddress,
        to: toAddress,
        amount,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * Transfer ETH
   */
  public async transferETH(
    toAddress: string,
    amount: string,
    gasLimit?: string
  ): Promise<{
    txHash: string;
    gasUsed: string;
    gasPrice: string;
    blockNumber: number;
  }> {
    const startTime = Date.now();
    let success = false;

    try {
      // Validate addresses
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid address format');
      }

      // Parse amount
      const amountWei = ethers.parseEther(amount);

      // Check balance
      const balance = await this.provider.getBalance(this.operatorWallet.address);
      const gasEstimate = await this.provider.estimateGas({
        to: toAddress,
        value: amountWei
      });

      const totalCost = amountWei + (gasEstimate * ethers.parseUnits('20', 'gwei'));
      if (balance < totalCost) {
        throw new Error('Insufficient ETH balance for transfer + gas');
      }

      // Estimate gas
      const gasLimitToUse = gasLimit || (gasEstimate * BigInt(120) / BigInt(100)); // 20% buffer

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Execute transfer
      const tx = await this.operatorWallet.sendTransaction({
        to: toAddress,
        value: amountWei,
        gasLimit: gasLimitToUse,
        gasPrice: gasPrice
      });

      logger.info('ETH transfer initiated', {
        txHash: tx.hash,
        to: toAddress,
        amount: amount,
        gasLimit: gasLimitToUse.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }

      success = true;

      const result = {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
        blockNumber: receipt.blockNumber
      };

      monitoring.trackBlockchainTransaction(tx.hash, 'base', success);

      logger.info('ETH transfer completed', {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      });

      return result;

    } catch (error) {
      monitoring.trackBlockchainTransaction('unknown', 'base', false);
      monitoring.trackDbQuery('transferETH', Date.now() - startTime, false);

      logger.error('ETH transfer failed', {
        to: toAddress,
        amount,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * Get transaction history for an address
   */
  public async getTransactionHistory(address: string, limit: number = 10): Promise<any[]> {
    try {
      // This would typically query a blockchain indexer or our database
      // For now, return empty array as this requires additional infrastructure
      logger.info('Transaction history requested', { address, limit });

      // TODO: Implement transaction history lookup via BaseScan API or indexer
      return [];

    } catch (error) {
      logger.error('Failed to get transaction history', {
        address,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get gas price estimate
   */
  public async getGasPrice(): Promise<{
    gasPrice: string;
    estimatedCost: string;
    baseFee: string;
  }> {
    try {
      const feeData = await this.provider.getFeeData();

      if (!feeData.gasPrice) {
        throw new Error('Failed to get gas price from provider');
      }

      const gasPrice = ethers.formatUnits(feeData.gasPrice, 'gwei');

      // Estimate cost for a simple transfer (21000 gas)
      const estimatedGas = 21000;
      const estimatedCost = ethers.formatEther(
        feeData.gasPrice * BigInt(estimatedGas)
      );

      return {
        gasPrice: `${gasPrice} gwei`,
        estimatedCost: `${estimatedCost} ETH`,
        baseFee: '0 gwei' // Base fee not available in ethers v6
      };

    } catch (error) {
      logger.error('Failed to get gas price', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get token information
   */
  public async getTokenInfo(tokenAddress: string): Promise<{
    symbol: string;
    name: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function symbol() view returns (string)',
          'function name() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)'
        ],
        this.provider
      );

      const [symbol, name, decimals, totalSupply] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);

      return {
        symbol,
        name,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      };

    } catch (error) {
      logger.error('Failed to get token info', {
        tokenAddress,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Validate address format
   */
  public isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get network information
   */
  public async getNetworkInfo(): Promise<{
    chainId: number;
    chainName: string;
    rpcUrl: string;
    blockNumber: number;
    gasPrice: string;
  }> {
    try {
      const [network, blockNumber] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber()
      ]);

      const feeData = await this.provider.getFeeData();

      return {
        chainId: Number(network.chainId),
        chainName: network.name,
        rpcUrl: this.baseRpcUrl,
        blockNumber,
        gasPrice: feeData.gasPrice
          ? ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei'
          : 'unknown'
      };

    } catch (error) {
      logger.error('Failed to get network info', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Health check for blockchain connection
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      return blockNumber > 0 && gasPrice.gasPrice !== null;

    } catch (error) {
      logger.error('Blockchain health check failed', {
        error: (error as Error).message
      });
      return false;
    }
  }
}

// Export singleton instance
export const blockchainService = BlockchainService.getInstance();
