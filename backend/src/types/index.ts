/**
 * Core type definitions for CryptoChap backend
 */

// User types
export interface User {
  id: string;
  phoneNumber: string;
  whatsappId: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultCurrency: string;
  notifications: boolean;
  language: string;
  timezone: string;
}

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  address: string;
  network: string;
  isActive: boolean;
  createdAt: Date;
  balances: WalletBalance[];
}

export interface WalletBalance {
  currency: string;
  amount: string;
  lastUpdated: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  currency: string;
  fromAddress?: string;
  toAddress?: string;
  network: string;
  txHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  fee?: string;
  metadata: TransactionMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type TransactionType =
  | 'send'
  | 'receive'
  | 'buy'
  | 'sell'
  | 'swap'
  | 'deposit'
  | 'withdraw';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TransactionMetadata {
  description?: string;
  exchangeRate?: number;
  fiatAmount?: number;
  fiatCurrency?: string;
  reference?: string;
  tags?: string[];
}

// WhatsApp types
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: WhatsAppMessageType;
  content: WhatsAppMessageContent;
  timestamp: Date;
  status: WhatsAppMessageStatus;
  metadata?: Record<string, any>;
}

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'document'
  | 'audio'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'interactive';

export type WhatsAppMessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface WhatsAppMessageContent {
  text?: string;
  media?: WhatsAppMedia;
  location?: WhatsAppLocation;
  contact?: WhatsAppContact;
  interactive?: WhatsAppInteractive;
}

export interface WhatsAppMedia {
  id: string;
  url: string;
  mimeType: string;
  caption?: string;
  filename?: string;
}

export interface WhatsAppLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface WhatsAppContact {
  name: string;
  phoneNumber: string;
}

export interface WhatsAppInteractive {
  type: 'button' | 'list';
  buttonReply?: {
    id: string;
    title: string;
  };
  listReply?: {
    id: string;
    title: string;
    description?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Request types
export interface CreateTransactionRequest {
  userId: string;
  type: TransactionType;
  amount: string;
  currency: string;
  toAddress?: string;
  network: string;
  description?: string;
}

export interface UpdateUserRequest {
  phoneNumber?: string;
  walletAddress?: string;
  preferences?: Partial<UserPreferences>;
  isActive?: boolean;
}

export interface SendMessageRequest {
  to: string;
  message: string;
  type?: WhatsAppMessageType;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Command types
export interface Command {
  id: string;
  name: string;
  description: string;
  parameters: CommandParameter[];
  handler: string;
  enabled: boolean;
  createdAt: Date;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'address' | 'amount';
  required: boolean;
  description: string;
  validation?: RegExp;
}

// Rate limiting types
export interface RateLimit {
  identifier: string;
  endpoint: string;
  requests: number;
  windowMs: number;
  resetTime: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'transaction_completed'
  | 'transaction_failed'
  | 'wallet_balance_updated'
  | 'security_alert'
  | 'system_maintenance';

// Configuration types
export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  database: DatabaseConfig;
  whatsapp: WhatsAppConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
  rateLimiting: RateLimitConfig;
  logging: LoggingConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  token: string;
  apiVersion: string;
  appSecret: string;
  webhookVerifyToken: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  strictWindowMs: number;
  strictMaxRequests: number;
}

export interface LoggingConfig {
  level: string;
  enableFileLogging: boolean;
  logDirectory: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Error types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }

  public details?: Record<string, any>;
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}