# CryptoChap System Design

## Design Principles

### 1. Security First
- **Zero Trust Architecture**: Every request is verified and validated
- **Defense in Depth**: Multiple security layers protect against threats
- **Privacy by Design**: User data is encrypted and access is minimized
- **Secure Defaults**: System defaults to most secure configuration

### 2. User-Centric Design
- **Mobile-First**: Optimized for mobile WhatsApp experience
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Accessibility**: WCAG 2.1 AA compliance for all features
- **Inclusive Design**: Works across different languages and cultures

### 3. Scalability & Performance
- **Horizontal Scaling**: System designed to scale horizontally
- **Caching Strategy**: Multi-layer caching for optimal performance
- **Asynchronous Processing**: Non-blocking operations for responsiveness
- **Resource Optimization**: Efficient use of compute and storage resources

### 4. Maintainability & Extensibility
- **Modular Architecture**: Components can be developed and deployed independently
- **Clean Code**: Readable, well-documented, and testable code
- **API Design**: RESTful APIs with consistent patterns
- **Configuration Management**: Environment-based configuration

## Component Design

### Frontend Architecture

#### Component Hierarchy
```
App (Root)
├── Layout
│   ├── Header
│   │   ├── ChatHeader
│   │   ├── WalletStatus
│   │   └── MobileWalletStatus
│   ├── Main
│   │   ├── ChatInterface
│   │   │   ├── MessageList
│   │   │   │   ├── MessageBubble
│   │   │   │   └── TypingIndicator
│   │   │   ├── ChatInput
│   │   │   └── MenuSystem
│   │   └── UIProvider
│   └── Footer
```

#### State Management Design
```typescript
// Context-based state management
interface AppState {
  user: User | null;
  wallet: WalletState;
  messages: Message[];
  ui: UIState;
}

// Custom hooks for state logic
const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);

  const refreshBalance = useCallback(async () => {
    // Balance refresh logic
  }, []);

  return { wallet, refreshBalance };
};
```

#### Component Patterns
- **Container/Presentational**: Separation of logic and presentation
- **Compound Components**: Related components grouped together
- **Render Props**: Flexible component composition
- **Custom Hooks**: Reusable stateful logic

### Backend Architecture

#### API Design
```typescript
// RESTful API structure
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: PaginationMeta;
}

// Resource-based routing
/api
├── /users
│   ├── GET /users/:phone
│   ├── POST /users
│   └── PUT /users/:phone
├── /wallets
│   ├── GET /wallets/:address/balance
│   ├── POST /wallets/:address/transfer
│   └── GET /wallets/:address/transactions
├── /whatsapp
│   ├── POST /whatsapp/webhook
│   └── GET /whatsapp/webhook
└── /health
    └── GET /health
```

#### Service Layer Design
```typescript
// Service interface pattern
interface WhatsAppService {
  sendMessage(to: string, message: WhatsAppMessage): Promise<void>;
  verifyWebhook(payload: string, signature: string): boolean;
  getMessageStatus(messageId: string): Promise<MessageStatus>;
}

// Dependency injection
class MessageProcessor {
  constructor(
    private whatsappService: WhatsAppService,
    private walletService: WalletService,
    private logger: Logger
  ) {}
}
```

### Database Design

#### Schema Design
```sql
-- User management
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction history
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'send', 'receive', 'buy', 'sell'
  amount DECIMAL(36,18) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  to_address VARCHAR(42),
  tx_hash VARCHAR(66) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp messages
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY,
  message_id VARCHAR(100) UNIQUE,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  content TEXT,
  type VARCHAR(20) DEFAULT 'text',
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_from ON whatsapp_messages(from_number, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
```

### Blockchain Integration Design

#### Wallet Management
```typescript
// Deterministic wallet generation
class WalletManager {
  private derivePath = "m/44'/60'/0'/0/0";

  generateWallet(phone: string): Wallet {
    const seed = ethers.keccak256(ethers.toUtf8Bytes(phone + this.salt));
    const masterNode = ethers.HDNodeWallet.fromSeed(seed);
    const wallet = masterNode.derivePath(this.derivePath);

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey
    };
  }
}
```

#### Transaction Processing
```typescript
// Transaction pipeline
class TransactionProcessor {
  async processTransaction(tx: TransactionRequest): Promise<TransactionResult> {
    // 1. Validate transaction
    await this.validateTransaction(tx);

    // 2. Check balance
    await this.checkBalance(tx.from, tx.amount, tx.currency);

    // 3. Estimate gas
    const gasEstimate = await this.estimateGas(tx);

    // 4. Send transaction
    const txHash = await this.sendTransaction(tx);

    // 5. Wait for confirmation
    const receipt = await this.waitForConfirmation(txHash);

    // 6. Update database
    await this.updateTransactionStatus(tx.id, 'confirmed', receipt);

    return { txHash, receipt };
  }
}
```

## Security Design

### Authentication & Authorization
```typescript
// Webhook verification
class WebhookAuthenticator {
  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature)
    );
  }
}

// Rate limiting
class RateLimiter {
  private attempts = new Map<string, number[]>();

  isAllowed(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    const userAttempts = this.attempts.get(identifier) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return true;
  }
}
```

### Data Protection
```typescript
// Encryption utilities
class EncryptionService {
  encrypt(data: string, key: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedData: string, key: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

## Performance Design

### Caching Strategy
```typescript
// Multi-layer caching
class CacheManager {
  private memoryCache = new Map<string, any>();
  private redisClient: Redis;

  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. Check Redis cache
    const redisData = await this.redisClient.get(key);
    if (redisData) {
      const parsed = JSON.parse(redisData);
      this.memoryCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Store in both caches
    this.memoryCache.set(key, value);
    await this.redisClient.setex(key, ttl || 3600, JSON.stringify(value));
  }
}
```

### Database Optimization
```typescript
// Connection pooling
class DatabaseManager {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query<T>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

## Error Handling Design

### Error Classification
```typescript
// Error types
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

// Structured error response
interface ErrorResponse {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
}
```

### Error Recovery
```typescript
// Retry mechanism
class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          await this.delay(delay * Math.pow(2, attempt - 1)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }
}
```

## Testing Design

### Test Pyramid
```
End-to-End Tests (10%)
    ↓
Integration Tests (20%)
    ↓
Unit Tests (70%)
```

### Test Structure
```typescript
// Unit test example
describe('MessageProcessor', () => {
  let messageProcessor: MessageProcessor;
  let mockWhatsAppService: jest.Mocked<WhatsAppService>;
  let mockWalletService: jest.Mocked<WalletService>;

  beforeEach(() => {
    mockWhatsAppService = {
      sendMessage: jest.fn(),
      verifyWebhook: jest.fn()
    };

    mockWalletService = {
      getBalance: jest.fn(),
      transfer: jest.fn()
    };

    messageProcessor = new MessageProcessor(
      mockWhatsAppService,
      mockWalletService
    );
  });

  describe('parseCommand', () => {
    it('should parse balance command correctly', () => {
      const result = messageProcessor.parseCommand('balance');

      expect(result.type).toBe('balance');
    });
  });
});
```

## Deployment Design

### Containerization
```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

### Infrastructure as Code
```terraform
# AWS infrastructure
resource "aws_ecs_cluster" "cryptochap" {
  name = "cryptochap-cluster"
}

resource "aws_ecs_service" "cryptochap_service" {
  name            = "cryptochap-service"
  cluster         = aws_ecs_cluster.cryptochap.id
  task_definition = aws_ecs_task_definition.cryptochap.arn
  desired_count   = 2

  load_balancer {
    target_group_arn = aws_lb_target_group.cryptochap.arn
    container_name   = "cryptochap"
    container_port   = 3000
  }
}
```

This system design provides a comprehensive blueprint for building a secure, scalable, and maintainable CryptoChap platform that can handle the complexities of WhatsApp-based crypto transactions while maintaining high performance and user experience standards.