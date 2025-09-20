import { ethers } from 'ethers';
import { logger } from '../utils/logger';

/**
 * Interface for token information
 */
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

/**
 * Interface for wallet balance
 */
interface WalletBalance {
  token: string;
  balance: string;
  formattedBalance: string;
  usdValue?: string;
}

/**
 * Interface for transaction data
 */
interface TransactionData {
  to: string;
  amount: string;
  tokenAddress?: string;
  gasLimit?: string;
}

/**
 * ERC-20 ABI for token interactions
 */
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

/**
 * Service for interacting with blockchain wallets and tokens
 */
export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private network: string;

  // Known token addresses on Base network
  private readonly TOKENS: Record<string, TokenInfo> = {
    USDC: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin'
    },
    WETH: {
      address: '0x4200000000000000000000000000000000000006', // Base WETH
      symbol: 'WETH',
      decimals: 18,
      name: 'Wrapped Ether'
    }
  };

  /**
   * Create a new wallet service instance
   */
  constructor() {
    this.network = process.env.NETWORK || 'base';
    const rpcUrl = this.getRpcUrl();

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get RPC URL for the current network
   */
  private getRpcUrl(): string {
    switch (this.network) {
      case 'base':
        return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
      case 'base-sepolia':
        return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
      default:
        return process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
    }
  }

  /**
   * Get wallet balance for a specific token
   */
  async getTokenBalance(
    walletAddress: string,
    tokenSymbol: string = 'USDC'
  ): Promise<WalletBalance> {
    try {
      const token = this.TOKENS[tokenSymbol.toUpperCase()];

      if (!token) {
        throw new Error(`Unsupported token: ${tokenSymbol}`);
      }

      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider);
      const balance = await tokenContract.balanceOf(walletAddress);

      const formattedBalance = ethers.formatUnits(balance, token.decimals);

      logger.info('Token balance retrieved', {
        walletAddress,
        token: tokenSymbol,
        balance: formattedBalance
      });

      return {
        token: tokenSymbol,
        balance: balance.toString(),
        formattedBalance
      };
    } catch (error) {
      logger.error('Error getting token balance', {
        walletAddress,
        token: tokenSymbol,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get all token balances for a wallet
   */
  async getAllBalances(walletAddress: string): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];

    for (const [symbol, token] of Object.entries(this.TOKENS)) {
      try {
        const balance = await this.getTokenBalance(walletAddress, symbol);
        balances.push(balance);
      } catch (error) {
        logger.warn(`Failed to get ${symbol} balance`, {
          walletAddress,
          error: (error as Error).message
        });
      }
    }

    return balances;
  }

  /**
   * Get native token (ETH) balance
   */
  async getNativeBalance(walletAddress: string): Promise<WalletBalance> {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const balance = await this.provider.getBalance(walletAddress);
      const formattedBalance = ethers.formatEther(balance);

      return {
        token: 'ETH',
        balance: balance.toString(),
        formattedBalance
      };
    } catch (error) {
      logger.error('Error getting native balance', {
        walletAddress,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Validate wallet address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get token information
   */
  getTokenInfo(tokenSymbol: string): TokenInfo | null {
    return this.TOKENS[tokenSymbol.toUpperCase()] || null;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: TransactionData): Promise<string> {
    try {
      let gasEstimate: bigint;

      if (transaction.tokenAddress) {
        // ERC-20 transfer
        const tokenContract = new ethers.Contract(
          transaction.tokenAddress,
          ERC20_ABI,
          this.provider
        );

        const token = Object.values(this.TOKENS).find(t => t.address === transaction.tokenAddress);
        if (!token) {
          throw new Error('Unsupported token');
        }

        const amount = ethers.parseUnits(transaction.amount, token.decimals);
        gasEstimate = await tokenContract.transfer.estimateGas(transaction.to, amount);
      } else {
        // Native token transfer
        const tx = {
          to: transaction.to,
          value: ethers.parseEther(transaction.amount)
        };
        gasEstimate = await this.provider.estimateGas(tx);
      }

      // Add 20% buffer
      const gasWithBuffer = (gasEstimate * BigInt(120)) / BigInt(100);

      return gasWithBuffer.toString();
    } catch (error) {
      logger.error('Error estimating gas', {
        transaction,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return gasPrice.gasPrice?.toString() || '0';
    } catch (error) {
      logger.error('Error getting gas price', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{
    name: string;
    chainId: number;
    blockNumber: number;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber
      };
    } catch (error) {
      logger.error('Error getting network info', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string): Promise<boolean> {
    try {
      if (!ethers.isAddress(address)) {
        return false;
      }

      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      logger.error('Error checking if address is contract', {
        address,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return null;
      }

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
        logs: receipt.logs
      };
    } catch (error) {
      logger.error('Error getting transaction receipt', {
        txHash,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Format amount with proper decimals
   */
  formatAmount(amount: string, tokenSymbol: string): string {
    const token = this.getTokenInfo(tokenSymbol);
    if (!token) {
      return amount;
    }

    try {
      return ethers.formatUnits(amount, token.decimals);
    } catch (error) {
      logger.error('Error formatting amount', {
        amount,
        tokenSymbol,
        error: (error as Error).message
      });
      return amount;
    }
  }

  /**
   * Parse amount to wei/units
   */
  parseAmount(amount: string, tokenSymbol: string): string {
    const token = this.getTokenInfo(tokenSymbol);
    if (!token) {
      return amount;
    }

    try {
      const parsed = ethers.parseUnits(amount, token.decimals);
      return parsed.toString();
    } catch (error) {
      logger.error('Error parsing amount', {
        amount,
        tokenSymbol,
        error: (error as Error).message
      });
      return amount;
    }
  }
}

// Create singleton instance
export const walletService = new WalletService();