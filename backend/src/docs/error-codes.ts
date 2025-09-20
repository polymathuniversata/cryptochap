/**
 * Comprehensive error documentation for CryptoChap API
 * This provides detailed information about all error codes and their meanings
 */

export interface ErrorDocumentation {
  code: string;
  statusCode: number;
  message: string;
  description: string;
  category: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'conflict' | 'rate_limit' | 'internal' | 'external';
  recoverable: boolean;
  userMessage: string;
  troubleshooting: string[];
  example?: any;
}

export const ERROR_CODES: Record<string, ErrorDocumentation> = {
  // Validation Errors (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    message: 'Request validation failed',
    description: 'The request contains invalid or malformed data',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please check your input and try again',
    troubleshooting: [
      'Verify all required fields are provided',
      'Check data formats (phone numbers, addresses, amounts)',
      'Ensure string lengths are within limits',
      'Validate numeric values are in correct range'
    ],
    example: {
      field: 'phoneNumber',
      message: 'Phone number must be in international format (e.g., +1234567890)',
      value: '1234567890'
    }
  },

  INVALID_PHONE_NUMBER: {
    code: 'INVALID_PHONE_NUMBER',
    statusCode: 400,
    message: 'Invalid phone number format',
    description: 'Phone number is not in international format',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please provide a valid phone number (e.g., +1234567890)',
    troubleshooting: [
      'Include country code with + prefix',
      'Remove any spaces, dashes, or parentheses',
      'Ensure number is 10-15 digits long'
    ]
  },

  INVALID_WALLET_ADDRESS: {
    code: 'INVALID_WALLET_ADDRESS',
    statusCode: 400,
    message: 'Invalid wallet address format',
    description: 'Wallet address is not a valid Ethereum address',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please provide a valid Ethereum wallet address (0x...)',
    troubleshooting: [
      'Ensure address starts with 0x',
      'Verify address is 42 characters long',
      'Check for typos in the address'
    ]
  },

  INVALID_AMOUNT: {
    code: 'INVALID_AMOUNT',
    statusCode: 400,
    message: 'Invalid amount format',
    description: 'Transaction amount is not in correct format',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please provide a valid amount (e.g., 100.50)',
    troubleshooting: [
      'Use numeric values only',
      'Maximum 18 decimal places allowed',
      'Amount must be greater than 0'
    ]
  },

  INVALID_CURRENCY: {
    code: 'INVALID_CURRENCY',
    statusCode: 400,
    message: 'Invalid currency specified',
    description: 'Currency is not supported',
    category: 'validation',
    recoverable: true,
    userMessage: 'Supported currencies: USDC, ETH, BASE',
    troubleshooting: [
      'Use supported currency codes only',
      'Check for typos in currency name'
    ]
  },

  INVALID_NETWORK: {
    code: 'INVALID_NETWORK',
    statusCode: 400,
    message: 'Invalid network specified',
    description: 'Blockchain network is not supported',
    category: 'validation',
    recoverable: true,
    userMessage: 'Supported networks: base, ethereum, sepolia',
    troubleshooting: [
      'Use supported network names only',
      'Check current network support status'
    ]
  },

  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    statusCode: 400,
    message: 'Required field is missing',
    description: 'A mandatory field was not provided in the request',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please provide all required information',
    troubleshooting: [
      'Check API documentation for required fields',
      'Ensure all mandatory parameters are included'
    ]
  },

  INVALID_REQUEST_FORMAT: {
    code: 'INVALID_REQUEST_FORMAT',
    statusCode: 400,
    message: 'Invalid request format',
    description: 'Request body or parameters are malformed',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please check your request format',
    troubleshooting: [
      'Ensure JSON is valid',
      'Check Content-Type header',
      'Verify parameter encoding'
    ]
  },

  // Authentication Errors (401)
  AUTHENTICATION_ERROR: {
    code: 'AUTHENTICATION_ERROR',
    statusCode: 401,
    message: 'Authentication required',
    description: 'Valid authentication credentials are required',
    category: 'authentication',
    recoverable: true,
    userMessage: 'Please log in to access this resource',
    troubleshooting: [
      'Check if authentication token is provided',
      'Verify token has not expired',
      'Ensure token is valid and properly formatted'
    ]
  },

  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    statusCode: 401,
    message: 'Invalid authentication token',
    description: 'The provided authentication token is invalid or malformed',
    category: 'authentication',
    recoverable: true,
    userMessage: 'Your session has expired. Please log in again',
    troubleshooting: [
      'Request a new authentication token',
      'Check token format and encoding',
      'Verify token was not tampered with'
    ]
  },

  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    statusCode: 401,
    message: 'Authentication token has expired',
    description: 'The authentication token has expired and needs to be refreshed',
    category: 'authentication',
    recoverable: true,
    userMessage: 'Your session has expired. Please log in again',
    troubleshooting: [
      'Request a new token using refresh token',
      'Complete authentication flow again'
    ]
  },

  // Authorization Errors (403)
  AUTHORIZATION_ERROR: {
    code: 'AUTHORIZATION_ERROR',
    statusCode: 403,
    message: 'Insufficient permissions',
    description: 'The authenticated user does not have permission to access this resource',
    category: 'authorization',
    recoverable: false,
    userMessage: 'You do not have permission to perform this action',
    troubleshooting: [
      'Check if user role has required permissions',
      'Contact administrator for access',
      'Verify account status is active'
    ]
  },

  INSUFFICIENT_BALANCE: {
    code: 'INSUFFICIENT_BALANCE',
    statusCode: 403,
    message: 'Insufficient balance for transaction',
    description: 'User wallet does not have sufficient funds for the transaction',
    category: 'authorization',
    recoverable: true,
    userMessage: 'Insufficient funds in your wallet',
    troubleshooting: [
      'Check wallet balance',
      'Reduce transaction amount',
      'Deposit funds first'
    ]
  },

  DAILY_LIMIT_EXCEEDED: {
    code: 'DAILY_LIMIT_EXCEEDED',
    statusCode: 403,
    message: 'Daily transaction limit exceeded',
    description: 'User has exceeded daily transaction limits',
    category: 'authorization',
    recoverable: true,
    userMessage: 'Daily transaction limit reached. Try again tomorrow',
    troubleshooting: [
      'Wait until daily limit resets',
      'Contact support for limit increase',
      'Split large transactions across multiple days'
    ]
  },

  // Not Found Errors (404)
  NOT_FOUND_ERROR: {
    code: 'NOT_FOUND_ERROR',
    statusCode: 404,
    message: 'Resource not found',
    description: 'The requested resource does not exist',
    category: 'not_found',
    recoverable: true,
    userMessage: 'The requested information could not be found',
    troubleshooting: [
      'Check if the ID or identifier is correct',
      'Verify the resource exists',
      'Ensure proper permissions to access resource'
    ]
  },

  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    statusCode: 404,
    message: 'User not found',
    description: 'The specified user does not exist in the system',
    category: 'not_found',
    recoverable: true,
    userMessage: 'User account not found',
    troubleshooting: [
      'Verify user ID is correct',
      'Check if user account is active',
      'Ensure user has completed registration'
    ]
  },

  TRANSACTION_NOT_FOUND: {
    code: 'TRANSACTION_NOT_FOUND',
    statusCode: 404,
    message: 'Transaction not found',
    description: 'The specified transaction does not exist',
    category: 'not_found',
    recoverable: true,
    userMessage: 'Transaction not found',
    troubleshooting: [
      'Check transaction ID is correct',
      'Verify transaction exists in system',
      'Check if transaction was completed successfully'
    ]
  },

  // Conflict Errors (409)
  CONFLICT_ERROR: {
    code: 'CONFLICT_ERROR',
    statusCode: 409,
    message: 'Resource conflict',
    description: 'The request conflicts with current state of the resource',
    category: 'conflict',
    recoverable: true,
    userMessage: 'This action conflicts with existing data',
    troubleshooting: [
      'Check for duplicate entries',
      'Verify unique constraints',
      'Resolve conflicting data before retrying'
    ]
  },

  USER_ALREADY_EXISTS: {
    code: 'USER_ALREADY_EXISTS',
    statusCode: 409,
    message: 'User already exists',
    description: 'A user with the same phone number or wallet address already exists',
    category: 'conflict',
    recoverable: true,
    userMessage: 'An account with this phone number already exists',
    troubleshooting: [
      'Check if user already has an account',
      'Use different phone number',
      'Contact support for account recovery'
    ]
  },

  TRANSACTION_ALREADY_PROCESSED: {
    code: 'TRANSACTION_ALREADY_PROCESSED',
    statusCode: 409,
    message: 'Transaction already processed',
    description: 'The transaction has already been processed and cannot be modified',
    category: 'conflict',
    recoverable: false,
    userMessage: 'This transaction has already been completed',
    troubleshooting: [
      'Check transaction status',
      'Create a new transaction if needed',
      'Contact support if you believe this is an error'
    ]
  },

  // Rate Limiting Errors (429)
  RATE_LIMIT_ERROR: {
    code: 'RATE_LIMIT_ERROR',
    statusCode: 429,
    message: 'Rate limit exceeded',
    description: 'Too many requests have been sent in a short period',
    category: 'rate_limit',
    recoverable: true,
    userMessage: 'Too many requests. Please wait before trying again',
    troubleshooting: [
      'Wait for rate limit to reset (15 minutes)',
      'Reduce frequency of requests',
      'Implement exponential backoff',
      'Check for unnecessary repeated requests'
    ]
  },

  // External Service Errors (502)
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    statusCode: 502,
    message: 'External service unavailable',
    description: 'An external service required for this operation is unavailable',
    category: 'external',
    recoverable: true,
    userMessage: 'Service temporarily unavailable. Please try again later',
    troubleshooting: [
      'Wait a few minutes and retry',
      'Check service status pages',
      'Contact support if issue persists'
    ]
  },

  BLOCKCHAIN_ERROR: {
    code: 'BLOCKCHAIN_ERROR',
    statusCode: 502,
    message: 'Blockchain network error',
    description: 'Error communicating with blockchain network',
    category: 'external',
    recoverable: true,
    userMessage: 'Network temporarily unavailable. Please try again',
    troubleshooting: [
      'Check blockchain network status',
      'Verify sufficient gas funds',
      'Try again in a few minutes'
    ]
  },

  WHATSAPP_ERROR: {
    code: 'WHATSAPP_ERROR',
    statusCode: 502,
    message: 'WhatsApp service error',
    description: 'Error communicating with WhatsApp services',
    category: 'external',
    recoverable: true,
    userMessage: 'WhatsApp service temporarily unavailable',
    troubleshooting: [
      'Check WhatsApp service status',
      'Verify API credentials',
      'Try again in a few minutes'
    ]
  },

  // Internal Server Errors (500)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    message: 'Internal server error',
    description: 'An unexpected error occurred on the server',
    category: 'internal',
    recoverable: true,
    userMessage: 'Something went wrong. Please try again',
    troubleshooting: [
      'Try the request again',
      'Contact support if issue persists',
      'Check server logs for more details'
    ]
  },

  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    statusCode: 500,
    message: 'Database connection error',
    description: 'Error connecting to or querying the database',
    category: 'internal',
    recoverable: true,
    userMessage: 'Service temporarily unavailable. Please try again',
    troubleshooting: [
      'Try again in a few minutes',
      'Check database connectivity',
      'Contact support if issue persists'
    ]
  },

  ENCRYPTION_ERROR: {
    code: 'ENCRYPTION_ERROR',
    statusCode: 500,
    message: 'Encryption/Decryption error',
    description: 'Error with cryptographic operations',
    category: 'internal',
    recoverable: false,
    userMessage: 'A security error occurred. Please contact support',
    troubleshooting: [
      'Contact support immediately',
      'Do not retry sensitive operations',
      'Check system security logs'
    ]
  }
};

/**
 * Get error documentation by error code
 */
export function getErrorDocumentation(code: string): ErrorDocumentation | undefined {
  return ERROR_CODES[code];
}

/**
 * Get all errors by category
 */
export function getErrorsByCategory(category: ErrorDocumentation['category']): ErrorDocumentation[] {
  return Object.values(ERROR_CODES).filter(error => error.category === category);
}

/**
 * Get all recoverable errors
 */
export function getRecoverableErrors(): ErrorDocumentation[] {
  return Object.values(ERROR_CODES).filter(error => error.recoverable);
}

/**
 * Get all validation errors
 */
export function getValidationErrors(): ErrorDocumentation[] {
  return getErrorsByCategory('validation');
}

/**
 * Format error for user-friendly display
 */
export function formatErrorForUser(errorCode: string, details?: any): {
  userMessage: string;
  code: string;
  canRetry: boolean;
  troubleshooting: string[];
} {
  const error = ERROR_CODES[errorCode];
  if (!error) {
    return {
      userMessage: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      canRetry: true,
      troubleshooting: ['Please try again', 'Contact support if issue persists']
    };
  }

  return {
    userMessage: error.userMessage,
    code: error.code,
    canRetry: error.recoverable,
    troubleshooting: error.troubleshooting
  };
}
