# CryptoChap Service Breakdown

## Backend Services (9 Total)

### 1. Blockchain Service (`blockchain.service.ts`)
**Purpose**: Core blockchain operations for Base network

**Key Features**:
- **USDC Transfers**: Secure token transfers with gas estimation
- **ETH Transfers**: Network fee payments and transfers
- **Balance Queries**: Multi-token balance checking (ETH, USDC, custom tokens)
- **Gas Management**: Price estimation with safety buffers
- **Network Info**: Chain status, block numbers, gas prices
- **Transaction Monitoring**: Hash tracking and confirmation waiting

**Methods**:
```typescript
- getWalletBalance(address, tokenAddress?) // Multi-token balances
- transferUSDC(from, to, amount, gasLimit?) // USDC transfers
- transferETH(to, amount, gasLimit?) // ETH transfers
- getTransactionHistory(address, limit) // Transaction history
- getGasPrice() // Gas price estimation
- getTokenInfo(tokenAddress) // Token metadata
- getNetworkInfo() // Network status
- healthCheck() // Blockchain connectivity
- isValidAddress(address) // Address validation
```

**Dependencies**: ethers.js v6, monitoring service, logging service

---

### 2. Wallet Derivation Service (`wallet-derivation.service.ts`)
**Purpose**: Secure HD wallet generation and management

**Key Features**:
- **BIP-44 Compliance**: Standard HD wallet derivation
- **Phone-based Wallets**: Deterministic wallet generation from phone numbers
- **Master Seed Security**: Secure seed phrase management
- **Batch Generation**: Multiple wallet creation for testing
- **Address Validation**: Format checking and verification
- **Key Encryption**: Secure private key storage

**Methods**:
```typescript
- deriveWallet(phone) // Deterministic wallet from phone
- generateRandomWallet() // Random wallet generation
- generateWalletFromSeed(seedPhrase) // Custom seed import
- getWalletAddress(phone) // Public address retrieval
- verifyWalletOwnership(phone, address) // Ownership verification
- validateWalletAddress(address) // Format validation
- encryptPrivateKey(key, password) // Key encryption
- decryptPrivateKey(encryptedKey, password) // Key decryption
```

**Security**: BIP-44 path derivation, phone number hashing

---

### 3. WhatsApp Engine Service (`whatsapp-engine.service.ts`)
**Purpose**: Message processing and command execution

**Key Features**:
- **Command Parsing**: Text command recognition and parsing
- **Interactive Buttons**: Button reply handling
- **Message Templates**: Formatted response generation
- **Error Handling**: User-friendly error messages
- **Transaction Processing**: Direct blockchain interaction
- **Response Formatting**: WhatsApp-optimized message formatting

**Supported Commands**:
- `balance` - Wallet balance display
- `send AMOUNT ADDRESS` - USDC transfers
- `receive` - Address sharing
- `help` - Command help
- `status` - Network status
- `wallet` - Wallet info
- `network` - Network details
- `gas` - Gas prices

**Message Types**: Text commands, button interactions, template responses

---

### 4. Monitoring Service (`monitoring.service.ts`)
**Purpose**: Performance tracking and system metrics

**Key Features**:
- **API Metrics**: Response times, success rates
- **Database Metrics**: Query performance, connection status
- **Blockchain Metrics**: Transaction times, gas usage
- **Memory Monitoring**: Usage tracking with thresholds
- **WhatsApp Metrics**: Message processing statistics
- **Error Tracking**: Categorization and alerting

**Metrics Tracked**:
```typescript
- API response times and success rates
- Database query performance
- Memory usage and garbage collection
- Blockchain transaction metrics
- WhatsApp message processing
- Error rates by category
```

**Alerting**: Configurable thresholds with automatic notifications

---

### 5. Database Backup Service (`database-backup.service.ts`)
**Purpose**: Automated data protection and recovery

**Key Features**:
- **Scheduled Backups**: Configurable backup intervals
- **Retention Policies**: Automatic cleanup of old backups
- **Compression**: Efficient storage with compression
- **Encryption**: Secure backup encryption
- **Restore Functionality**: Point-in-time recovery
- **Monitoring**: Backup success/failure tracking

**Backup Types**:
- Full database backups
- Incremental backups
- Point-in-time recovery
- Encrypted storage
- Retention management

**Scheduling**: Cron-based with configurable intervals

---

### 6. Logging Service (`logging.service.ts`)
**Purpose**: Structured logging with Winston

**Key Features**:
- **Multiple Levels**: Debug, info, warn, error
- **Structured Format**: JSON logging with metadata
- **Multiple Transports**: Console, file, external services
- **Log Rotation**: Automatic log file management
- **Security Logging**: Sensitive data filtering
- **Performance Logging**: Execution time tracking

**Log Levels**:
- ERROR: Application errors and failures
- WARN: Deprecations and potential issues
- INFO: General application flow
- DEBUG: Detailed debugging information

**Security**: Automatic filtering of sensitive data (keys, tokens)

---

### 7. Wallet Service (`wallet.service.ts`)
**Purpose**: Wallet lifecycle management

**Key Features**:
- **Wallet Creation**: Secure wallet initialization
- **Balance Tracking**: Real-time balance updates
- **Transaction History**: Complete transaction records
- **Multi-wallet Support**: Multiple wallets per user
- **Status Management**: Active/inactive wallet states
- **Metadata Management**: Custom wallet properties

**Operations**:
- Create wallet with derivation
- Update wallet balance
- Deactivate/reactivate wallets
- Get wallet transaction history
- Wallet status management
- Multi-wallet user support

---

### 8. Token Management Service (`token-management.service.ts`)
**Purpose**: Token operations and management

**Key Features**:
- **Token Information**: Symbol, decimals, supply
- **Balance Queries**: Multi-token balance checking
- **Transfer Operations**: Token transfer coordination
- **Approval Management**: Token spending approvals
- **Metadata Retrieval**: Token contract information
- **Event Monitoring**: Transfer event tracking

**Supported Tokens**:
- USDC (Base network)
- ETH (native token)
- Custom ERC20 tokens
- Future token integrations

---

### 9. WhatsApp Service (`whatsapp.service.ts`)
**Purpose**: WhatsApp Business API integration

**Key Features**:
- **Webhook Handling**: Message reception and verification
- **Message Sending**: Outbound message delivery
- **Template Management**: Message template handling
- **Status Updates**: Delivery and read status tracking
- **Media Support**: Image, document, audio handling
- **Rate Limiting**: API rate limit management

**API Integration**:
- Webhook verification
- Message sending
- Template messages
- Status callbacks
- Media uploads

## 🏗️ Service Architecture Patterns

### Singleton Pattern
All services implement singleton pattern for resource efficiency:
```typescript
export class ServiceName {
  private static instance: ServiceName;
  public static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }
}
```

### Dependency Injection
Services are loosely coupled with dependency injection:
```typescript
constructor(
  private blockchainService = BlockchainService.getInstance(),
  private monitoringService = MonitoringService.getInstance(),
  private logger = LoggerService.getInstance()
) {}
```

### Error Handling
Consistent error handling across all services:
```typescript
try {
  // Business logic
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  monitoring.trackError('service_name', 'operation', error);
  throw error;
}
```

### Monitoring Integration
All services integrate with monitoring:
```typescript
const startTime = Date.now();
// Operation
const duration = Date.now() - startTime;
monitoring.trackPerformance('service', 'operation', duration);
```

## 🔄 Service Interactions

### Request Flow
```
HTTP Request → Controller → Service → External API
     ↓            ↓          ↓           ↓
Validation → Business Logic → Database/Blockchain
```

### WhatsApp Flow
```
WhatsApp → Webhook → Engine → Blockchain → Response
  ↓          ↓         ↓          ↓          ↓
Verify → Parse Cmd → Execute → Update → Format
```

### Transaction Flow
```
User Request → Validation → Wallet Check → Blockchain TX → Confirmation
     ↓            ↓           ↓              ↓              ↓
API Endpoint → Middleware → Service Call → Network TX → Status Update
```

## 📊 Performance Characteristics

### Response Times
- **Simple Queries**: < 100ms
- **Balance Checks**: 200-500ms (blockchain)
- **Token Transfers**: 1-3 seconds (blockchain confirmation)
- **Complex Operations**: 500ms-2s

### Resource Usage
- **Memory**: Efficient singleton usage
- **Database**: Connection pooling
- **Blockchain**: Cached network calls
- **WhatsApp**: Rate-limited API calls

### Scalability
- **Horizontal**: Stateless service design
- **Database**: Read replicas support
- **Caching**: Redis integration
- **Async**: Background job processing

---

**Implementation Status**: ✅ All services fully implemented and tested
