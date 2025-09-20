import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Encrypted token information structure
 */
interface EncryptedTokenInfo {
  id: string;
  type: string;
  encryptedToken: string;
  iv: string;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

/**
 * Service for managing API tokens with encryption
 */
export class TokenManagementService {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  /**
   * Create a new token management service
   */
  constructor() {
    // Use a strong encryption key - in production, this should come from environment
    const keyString = process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars';
    this.encryptionKey = crypto.scryptSync(keyString, 'salt', 32);

    // Migrate any existing tokens from file storage to database
    this.migrateLegacyTokens();
  }

  /**
   * Encrypt a token
   */
  private encryptToken(token: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = (crypto as any).createCipherGCM(this.algorithm, this.encryptionKey);
    cipher.setIV(iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag
    };
  }

  /**
   * Decrypt a token
   */
  private decryptToken(encryptedToken: string, iv: string, authTag: string): string {
    const decipher = (crypto as any).createDecipherGCM(this.algorithm, this.encryptionKey);
    decipher.setIV(Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Migrate legacy tokens from file storage to database
   */
  private async migrateLegacyTokens(): Promise<void> {
    const legacyPath = path.join(process.cwd(), '.tokens.json');

    if (!fs.existsSync(legacyPath)) {
      return;
    }

    try {
      const legacyData = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));

      for (const [type, tokens] of Object.entries(legacyData)) {
        for (const tokenInfo of tokens as any[]) {
          await this.storeTokenInDatabase(type, tokenInfo.token, 60);
        }
      }

      // Backup and remove legacy file
      fs.renameSync(legacyPath, `${legacyPath}.backup`);
      logger.info('Legacy tokens migrated to database');
    } catch (error) {
      logger.error('Error migrating legacy tokens', { error: (error as Error).message });
    }
  }

  /**
   * Store a token in the database
   */
  private async storeTokenInDatabase(type: string, token: string, expiresInDays: number): Promise<void> {
    const { encrypted, iv, authTag } = this.encryptToken(token);
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + expiresInDays);

    const query = `
      INSERT INTO api_tokens (type, encrypted_token, iv, auth_tag, created_at, expires_at, is_valid)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (type) DO UPDATE SET
        encrypted_token = EXCLUDED.encrypted_token,
        iv = EXCLUDED.iv,
        auth_tag = EXCLUDED.auth_tag,
        expires_at = EXCLUDED.expires_at,
        is_valid = EXCLUDED.is_valid,
        updated_at = NOW()
    `;

    await db.query(query, [
      type,
      encrypted,
      iv,
      authTag,
      now.toISOString(),
      expiresAt.toISOString(),
      true
    ]);
  }

  /**
   * Retrieve and decrypt a token from database
   */
  private async getTokenFromDatabase(type: string): Promise<string | null> {
    const query = `
      SELECT encrypted_token, iv, auth_tag, expires_at, is_valid
      FROM api_tokens
      WHERE type = $1 AND is_valid = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [type]);

    if (result.rows.length === 0) {
      return null;
    }

    const { encrypted_token, iv, auth_tag, expires_at, is_valid } = result.rows[0];

    if (!is_valid || new Date(expires_at) < new Date()) {
      return null;
    }

    try {
      return this.decryptToken(encrypted_token, iv, auth_tag);
    } catch (error) {
      logger.error('Error decrypting token', { type, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Store a new token
   *
   * @param type The token type (e.g., 'whatsapp')
   * @param token The token string
   * @param expiresInDays Number of days until the token expires
   */
  public async storeToken(type: string, token: string, expiresInDays: number = 60): Promise<void> {
    if (!token) {
      throw new Error('Token cannot be empty');
    }

    try {
      await this.storeTokenInDatabase(type, token, expiresInDays);
      logger.info('Token stored securely', { type, expiresInDays });
    } catch (error) {
      logger.error('Error storing token', { type, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get the most recent valid token of a specific type
   *
   * @param type The token type (e.g., 'whatsapp')
   * @returns The most recent valid token or null if none found
   */
  public async getLatestToken(type: string): Promise<string | null> {
    try {
      return await this.getTokenFromDatabase(type);
    } catch (error) {
      logger.error('Error retrieving token', { type, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Mark a token as invalid
   *
   * @param type The token type
   * @param token The token to invalidate
   */
  public async invalidateToken(type: string, token?: string): Promise<void> {
    const query = `
      UPDATE api_tokens
      SET is_valid = false, updated_at = NOW()
      WHERE type = $1 ${token ? 'AND encrypted_token = $2' : ''}
    `;

    const params = token ? [type, this.encryptToken(token).encrypted] : [type];

    await db.query(query, params);
    logger.info('Token invalidated', { type });
  }

  /**
   * Check if a token is about to expire
   *
   * @param type The token type
   * @param daysThreshold Number of days threshold (default: 3)
   * @returns True if the token will expire within the threshold
   */
  public async isTokenExpiringSoon(type: string, daysThreshold: number = 3): Promise<boolean> {
    const query = `
      SELECT expires_at
      FROM api_tokens
      WHERE type = $1 AND is_valid = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [type]);

    if (result.rows.length === 0) {
      return true;
    }

    const expiryDate = new Date(result.rows[0].expires_at);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return expiryDate < thresholdDate;
  }

  /**
   * Update the current WhatsApp token in the environment and storage
   *
   * @param token The new token
   */
  public async updateWhatsAppToken(token: string): Promise<boolean> {
    if (!token) return false;

    try {
      // Store the token securely
      await this.storeToken('whatsapp', token, 60);

      // Update environment variable for current session
      process.env.META_WHATSAPP_TOKEN = token;

      logger.info('WhatsApp token updated and stored securely');
      return true;
    } catch (error) {
      logger.error('Error updating WhatsApp token', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Update WhatsApp token in the .env.local file
   *
   * @param token The new token
   * @returns Promise<boolean> indicating success
   */
  public async updateTokenInEnvFile(token: string): Promise<boolean> {
    if (!token) return false;

    try {
      const envPath = path.join(process.cwd(), '.env.local');

      if (!fs.existsSync(envPath)) {
        logger.warn('.env.local file not found, creating it');
        fs.writeFileSync(envPath, '');
      }

      let envContent = fs.readFileSync(envPath, 'utf8');

      // Replace the token line
      const tokenRegex = /^META_WHATSAPP_TOKEN=.*/m;
      if (tokenRegex.test(envContent)) {
        envContent = envContent.replace(tokenRegex, `META_WHATSAPP_TOKEN=${token}`);
      } else {
        // Add the token if it doesn't exist
        envContent += `\nMETA_WHATSAPP_TOKEN=${token}`;
      }

      fs.writeFileSync(envPath, envContent);
      logger.info('WhatsApp token updated in .env.local file');

      return true;
    } catch (error) {
      logger.error('Error updating token in .env file', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get all tokens for a type (for admin purposes)
   */
  public async getAllTokens(type: string): Promise<Array<{id: string, createdAt: string, expiresAt: string, isValid: boolean}>> {
    const query = `
      SELECT id, created_at, expires_at, is_valid
      FROM api_tokens
      WHERE type = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [type]);
    return result.rows.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      isValid: row.is_valid
    }));
  }
}

// Create a singleton instance
export const tokenManager = new TokenManagementService();
