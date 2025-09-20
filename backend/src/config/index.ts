import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Environment configuration with validation
 */
export class Config {
  // Server configuration
  public readonly PORT: number;
  public readonly NODE_ENV: string;
  public readonly FRONTEND_URL: string;

  // Database configuration
  public readonly DB_HOST: string;
  public readonly DB_PORT: number;
  public readonly DB_NAME: string;
  public readonly DB_USER: string;
  public readonly DB_PASSWORD: string;
  public readonly DB_MAX_CONNECTIONS: number;

  // WhatsApp/Meta configuration
  public readonly META_PHONE_NUMBER_ID: string;
  public readonly META_WHATSAPP_TOKEN: string;
  public readonly META_API_VERSION: string;
  public readonly META_APP_SECRET: string;
  public readonly META_WEBHOOK_VERIFY_TOKEN: string;

  // Blockchain configuration
  public readonly NETWORK: string;
  public readonly BASE_RPC_URL: string;
  public readonly BASE_SEPOLIA_RPC_URL: string;
  public readonly ETHEREUM_RPC_URL: string;

  // JWT configuration
  public readonly JWT_SECRET: string;
  public readonly JWT_EXPIRES_IN: string;
  public readonly JWT_REFRESH_EXPIRES_IN: string;

  // Redis configuration
  public readonly REDIS_HOST: string;
  public readonly REDIS_PORT: number;
  public readonly REDIS_PASSWORD?: string;
  public readonly REDIS_DB: number;

  // Rate limiting configuration
  public readonly RATE_LIMIT_WINDOW_MS: number;
  public readonly RATE_LIMIT_MAX_REQUESTS: number;
  public readonly STRICT_RATE_LIMIT_WINDOW_MS: number;
  public readonly STRICT_RATE_LIMIT_MAX_REQUESTS: number;

  // Logging configuration
  public readonly LOG_LEVEL: string;
  public readonly LOG_TO_FILE: boolean;
  public readonly LOG_DIRECTORY: string;

  constructor() {
    // Server configuration
    this.PORT = this.parseNumber('PORT', 3001);
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Database configuration
    this.DB_HOST = this.requireEnv('DB_HOST', 'localhost');
    this.DB_PORT = this.parseNumber('DB_PORT', 5432);
    this.DB_NAME = this.requireEnv('DB_NAME', 'cryptochap');
    this.DB_USER = this.requireEnv('DB_USER', 'postgres');
    this.DB_PASSWORD = this.requireEnv('DB_PASSWORD');
    this.DB_MAX_CONNECTIONS = this.parseNumber('DB_MAX_CONNECTIONS', 20);

    // WhatsApp/Meta configuration
    this.META_PHONE_NUMBER_ID = this.requireEnv('META_PHONE_NUMBER_ID');
    this.META_WHATSAPP_TOKEN = this.requireEnv('META_WHATSAPP_TOKEN');
    this.META_API_VERSION = process.env.META_API_VERSION || 'v18.0';
    this.META_APP_SECRET = this.requireEnv('META_APP_SECRET');
    this.META_WEBHOOK_VERIFY_TOKEN = this.requireEnv('META_WEBHOOK_VERIFY_TOKEN');

    // Blockchain configuration
    this.NETWORK = process.env.NETWORK || 'base';
    this.BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    this.BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    this.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || '';

    // JWT configuration
    this.JWT_SECRET = this.requireEnv('JWT_SECRET');
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    // Redis configuration
    this.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    this.REDIS_PORT = this.parseNumber('REDIS_PORT', 6379);
    this.REDIS_PASSWORD = process.env.REDIS_PASSWORD;
    this.REDIS_DB = this.parseNumber('REDIS_DB', 0);

    // Rate limiting configuration
    this.RATE_LIMIT_WINDOW_MS = this.parseNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000); // 15 minutes
    this.RATE_LIMIT_MAX_REQUESTS = this.parseNumber('RATE_LIMIT_MAX_REQUESTS', 100);
    this.STRICT_RATE_LIMIT_WINDOW_MS = this.parseNumber('STRICT_RATE_LIMIT_WINDOW_MS', 60 * 1000); // 1 minute
    this.STRICT_RATE_LIMIT_MAX_REQUESTS = this.parseNumber('STRICT_RATE_LIMIT_MAX_REQUESTS', 10);

    // Logging configuration
    this.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
    this.LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
    this.LOG_DIRECTORY = process.env.LOG_DIRECTORY || 'logs';

    this.validateConfiguration();
  }

  /**
   * Require an environment variable
   */
  private requireEnv(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;

    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }

    return value;
  }

  /**
   * Parse environment variable as number
   */
  private parseNumber(key: string, defaultValue: number): number {
    const value = process.env[key];

    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`);
    }

    return parsed;
  }

  /**
   * Validate the configuration
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate URLs
    if (!this.FRONTEND_URL.startsWith('http')) {
      errors.push('FRONTEND_URL must be a valid URL');
    }

    // Validate WhatsApp configuration
    if (!this.META_PHONE_NUMBER_ID.match(/^\d+$/)) {
      errors.push('META_PHONE_NUMBER_ID must be a valid phone number ID');
    }

    // Validate JWT secret
    if (this.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters long');
    }

    // Validate network configuration
    const validNetworks = ['base', 'base-sepolia', 'ethereum', 'polygon'];
    if (!validNetworks.includes(this.NETWORK)) {
      errors.push(`NETWORK must be one of: ${validNetworks.join(', ')}`);
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    logger.info('Configuration validated successfully', {
      environment: this.NODE_ENV,
      network: this.NETWORK,
      port: this.PORT
    });
  }

  /**
   * Get database connection string
   */
  public getDatabaseUrl(): string {
    return `postgresql://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`;
  }

  /**
   * Get Redis connection URL
   */
  public getRedisUrl(): string {
    const auth = this.REDIS_PASSWORD ? `:${this.REDIS_PASSWORD}@` : '';
    return `redis://${auth}${this.REDIS_HOST}:${this.REDIS_PORT}/${this.REDIS_DB}`;
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  /**
   * Get current RPC URL based on network
   */
  public getCurrentRpcUrl(): string {
    switch (this.NETWORK) {
      case 'base':
        return this.BASE_RPC_URL;
      case 'base-sepolia':
        return this.BASE_SEPOLIA_RPC_URL;
      case 'ethereum':
        return this.ETHEREUM_RPC_URL;
      default:
        return this.BASE_RPC_URL;
    }
  }
}

// Create and export singleton instance
export const config = new Config();

// Export for backward compatibility
export default config;