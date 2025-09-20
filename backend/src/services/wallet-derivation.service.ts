import { ethers, HDNodeWallet } from 'ethers';
import { logger } from '../services/logging.service';
import { monitoring } from '../services/monitoring.service';

/**
 * Interface for wallet derivation
 */
interface DerivedWallet {
  address: string;
  publicKey: string;
  path: string;
  phone: string;
}

/**
 * Service for secure HD wallet derivation using BIP-44
 */
export class WalletDerivationService {
  private masterWallet: HDNodeWallet;
  private basePath = "m/44'/60'/0'/0"; // BIP-44 Ethereum path

  constructor() {
    if (!process.env.WALLET_MASTER_SEED) {
      throw new Error('WALLET_MASTER_SEED environment variable is required for wallet derivation');
    }

    try {
      // Create master HD wallet from mnemonic seed
      this.masterWallet = HDNodeWallet.fromPhrase(process.env.WALLET_MASTER_SEED);
      logger.info('Wallet derivation service initialized with master wallet');
    } catch (error) {
      logger.error('Failed to initialize wallet derivation service', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate deterministic index from phone number
   * Uses keccak256 hash to ensure consistent, unique index per phone
   */
  private generateIndexFromPhone(phone: string): number {
    const phoneHash = ethers.keccak256(ethers.toUtf8Bytes(phone));
    // Convert to number within valid BIP-32 index range (0 to 2^31 - 1)
    const index = Number(ethers.toBigInt(phoneHash) % 2147483648n);
    return index;
  }

  /**
   * Derive a wallet for a given phone number
   * Uses BIP-44 path: m/44'/60'/0'/0/{index}
   */
  deriveWallet(phone: string): DerivedWallet {
    try {
      // Validate phone number format
      if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
        throw new Error('Invalid phone number format');
      }

      const index = this.generateIndexFromPhone(phone);
      const derivationPath = `${this.basePath}/${index}`;

      // Derive the child wallet
      const derivedWallet = this.masterWallet.derivePath(derivationPath);

      logger.info('Wallet derived successfully', {
        phone: phone.slice(-4), // Log only last 4 digits for privacy
        address: derivedWallet.address,
        path: derivationPath
      });

      return {
        address: derivedWallet.address,
        publicKey: derivedWallet.publicKey,
        path: derivationPath,
        phone
      };
    } catch (error) {
      logger.error('Error deriving wallet', {
        phone: phone.slice(-4),
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get wallet address for a phone number (public information)
   */
  getWalletAddress(phone: string): string {
    const wallet = this.deriveWallet(phone);
    return wallet.address;
  }

  /**
   * Verify that a phone number corresponds to a wallet address
   */
  verifyWalletOwnership(phone: string, address: string): boolean {
    try {
      const derivedAddress = this.getWalletAddress(phone);
      return derivedAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      logger.error('Error verifying wallet ownership', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get multiple wallet addresses for batch operations
   */
  getWalletAddresses(phones: string[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const phone of phones) {
      try {
        result[phone] = this.getWalletAddress(phone);
      } catch (error) {
        logger.warn('Failed to derive wallet for phone', {
          phone: phone.slice(-4),
          error: (error as Error).message
        });
      }
    }

    return result;
  }

  /**
   * Get the master wallet public key (for verification purposes only)
   */
  getMasterPublicKey(): string {
    return this.masterWallet.publicKey;
  }

  /**
   * Get derivation path for a phone number
   */
  getDerivationPath(phone: string): string {
    const index = this.generateIndexFromPhone(phone);
    return `${this.basePath}/${index}`;
  }

  /**
   * Validate wallet derivation setup
   */
  validateSetup(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.WALLET_MASTER_SEED) {
      errors.push('WALLET_MASTER_SEED environment variable is not set');
    }

    if (!this.masterWallet) {
      errors.push('Master wallet could not be initialized');
    }

    // Test derivation with a known phone
    try {
      const testPhone = '+1234567890';
      const wallet = this.deriveWallet(testPhone);
      if (!ethers.isAddress(wallet.address)) {
        errors.push('Derived wallet address is invalid');
      }
    } catch (error) {
      errors.push(`Wallet derivation test failed: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
export const walletDerivationService = new WalletDerivationService();