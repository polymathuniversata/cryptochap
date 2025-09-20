# CryptoChap System Architecture

## Overview
CryptoChap is a WhatsApp-native USDC wallet and payment system built on the Base network, enabling seamless cryptocurrency transactions through chat interfaces.

## System Components

### Frontend (Web Interface)
- **Framework**: Next.js 15 with TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Real-time Features**: WebSocket connections for live updates
- **Security**: Content Security Policy (CSP), input validation

### Backend (API Layer)
- **Framework**: Express.js with TypeScript
- **Architecture**: Modular route handlers with dependency injection
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and rate limiting
- **Security**: Comprehensive input validation, CSP headers, monitoring

### WhatsApp Integration
- **Provider**: Meta WhatsApp Business API
- **Features**: Interactive messages, templates, media support
- **Security**: Webhook signature verification, rate limiting, input sanitization

### Blockchain Layer
- **Network**: Base (Ethereum Layer 2)
- **Tokens**: USDC, ETH
- **Wallet Management**: Secure HD wallet derivation with encrypted storage
- **Smart Contracts**: Secure multi-sig wallet with OpenZeppelin standards
  - Access Control: Ownable + Operator roles
  - Security: ReentrancyGuard, input validation, replay protection
  - Emergency Functions: Owner-only withdrawal capabilities

### External Integrations
- **Onramp Providers**: Coinbase, MoonPay, Transak
- **Mobile Money**: M-Pesa, Airtel Money, Tigo Pesa
- **Price Oracles**: CoinGecko, Chainlink
- **Analytics**: Custom event tracking

## Security Architecture

### Input Validation & Sanitization
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Request       │───►│   Validation    │───►│   Security      │
│   Middleware    │    │   Middleware    │    │   Middleware    │
│                 │    │   (Joi schemas) │    │   (CSP, XSS)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Security Measures:**
- Joi-based validation schemas for all endpoints
- Security-focused input sanitization
- Suspicious pattern detection for malicious input
- Rate limiting (100 req/15min, 10 req/min for sensitive endpoints)

### Content Security Policy (CSP)
- Production-ready CSP headers to prevent XSS attacks
- API-specific security headers for enhanced protection
- Request ID middleware for comprehensive request tracing

### Monitoring & Observability
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───►│   Monitoring    │───►│   Alerting      │
│   Metrics       │    │   Service       │    │   System        │
│                 │    │   (Performance) │    │   (Thresholds)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Monitoring Features:**
- Performance metrics tracking with automatic alerting
- Memory usage monitoring with configurable thresholds
- Health check endpoints for system status
- Error tracking and categorization
- Database backup automation with retention policies

## Architecture Patterns

### Modular Backend Architecture
```
cryptochap/backend/src/
├── controllers/          # Route handlers (7 controllers)
│   ├── api.ts           # Legacy API routes
│   ├── index.ts         # Route index and mounting
│   ├── system.ts        # Health, metrics, docs
│   ├── users.ts         # User management
│   ├── wallets.ts       # Wallet operations
│   ├── transactions.ts  # Transaction handling
│   └── whatsapp.ts      # WhatsApp webhooks
├── middleware/          # Security & validation (4 middlewares)
│   ├── validation.ts    # Input validation (Joi schemas)
│   ├── security.ts      # Security headers (CSP, HSTS, XSS protection)
│   ├── rateLimiter.ts   # Rate limiting (100 req/15min global)
│   └── errorHandler.ts  # Error handling and logging
├── services/            # Business logic (9 services)
│   ├── blockchain.service.ts      # Base network operations (USDC, ETH)
│   ├── wallet-derivation.service.ts # HD wallet derivation (BIP-44)
│   ├── whatsapp-engine.service.ts  # Message processing engine
│   ├── monitoring.service.ts       # Performance metrics tracking
│   ├── database-backup.service.ts  # Backup automation
│   ├── logging.service.ts          # Structured logging (Winston)
│   ├── wallet.service.ts           # Wallet management
│   ├── token-management.service.ts # Token operations
│   └── whatsapp.service.ts         # WhatsApp integration
├── utils/               # Utility functions
│   ├── database.ts      # Database connection and queries
│   └── logger.ts        # Logging utilities
├── config/              # Configuration management
└── docs/                # API documentation
    ├── api-spec.ts      # OpenAPI 3.0 specification
    └── error-codes.ts   # Error code reference
```

### Service Layer Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │───►│   Services      │───►│   External      │
│   (REST API)    │    │   (Business     │    │   Services      │
│                 │    │    Logic)       │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • api.ts        │    │ • blockchain    │    │ • PostgreSQL    │
│ • system.ts     │    │ • wallet        │    │ • Redis         │
│ • users.ts      │    │ • whatsapp      │    │ • Base Network  │
│ • wallets.ts    │───►│ • monitoring    │───►│ • WhatsApp API  │
│ • transactions.ts│    │ • logging       │    │ • Email/SMS     │
│ • whatsapp.ts   │    │ • backup        │    │ • File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### WhatsApp Integration Architecture
```
WhatsApp User → WhatsApp API → Webhook → Message Parser → Command Processor → Blockchain TX → Response
     ↓              ↓            ↓            ↓              ↓              ↓            ↓
   Message     Verification  Validation   Route to      Execute        Update      Format
   Received    & Security    & Sanitize   Handler       Business       Status      Response
                                                        Logic
```

### Security-First Design
- **Defense in Depth**: Multiple layers of security validation
- **Principle of Least Privilege**: Minimal required permissions
- **Fail-Safe Defaults**: Secure by default configuration
- **Input Validation**: All inputs validated and sanitized at multiple layers
- **Error Handling**: Secure error handling that doesn't leak information
- **Monitoring**: Comprehensive tracking of all operations

### Scalability Patterns
- **Horizontal Scaling**: Stateless API design enables easy scaling
- **Database Optimization**: Connection pooling and query optimization
- **Caching Strategy**: Redis for session and computed data caching
- **Asynchronous Processing**: Background job processing for heavy operations
- **Load Balancing**: Multiple service instances behind load balancer

### Security-First Design
- **Defense in Depth**: Multiple layers of security validation
- **Principle of Least Privilege**: Minimal required permissions
- **Fail-Safe Defaults**: Secure by default configuration
- **Input Validation**: All inputs validated and sanitized
- **Error Handling**: Secure error handling that doesn't leak information

### Scalability Patterns
- **Horizontal Scaling**: Stateless API design
- **Database Optimization**: Connection pooling and query optimization
- **Caching Strategy**: Redis for session and computed data
- **Asynchronous Processing**: Background job processing for heavy operations

### Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Message       │    │   Blockchain    │
│   Gateway       │◄──►│   Processor     │◄──►│   Service       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User          │    │   Transaction   │    │   Wallet        │
│   Management    │    │   Engine        │    │   Manager       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Architecture
```
User Message → WhatsApp API → Webhook → Message Parser → Command Processor → Blockchain TX → Response → WhatsApp API → User
```

### Security Architecture
- **Authentication**: WhatsApp webhook signatures with HMAC verification
- **Authorization**: Phone number based access control with rate limiting
- **Encryption**: AES-256-GCM for sensitive data at rest, including API tokens
- **Key Management**: AWS KMS for private keys and token encryption keys
- **Rate Limiting**: Redis-based request throttling with progressive delays
- **Smart Contract Security**: OpenZeppelin standards, reentrancy protection, input validation
- **Audit Trail**: Comprehensive transaction logging and replay protection
- **Token Storage**: Encrypted database storage with automatic key rotation

## Technology Stack

### Frontend Technologies
- **React 18** - Component library
- **Next.js 15** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible components

### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - API framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Prisma** - Database ORM
- **ethers.js** - Blockchain interactions

### DevOps & Deployment
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **AWS/GCP** - Cloud platform
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CD pipelines
- **Datadog** - Monitoring and logging

## Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (AWS ALB)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
┌───────▼─────┐ ┌─▼───────┐ │ ┌─────────────────┐
│   Frontend  │ │ Backend │ │ │   Database      │
│   (Next.js) │ │ (API)   │ │ │   (PostgreSQL)  │
└─────────────┘ └─────────┘ │ └─────────────────┘
                            │
                    ┌───────▼─────┐
                    │   Redis     │
                    │   Cache     │
                    └─────────────┘
```

### Staging Environment
- Mirrors production with reduced resources
- Used for integration testing and QA
- Automated deployment from develop branch

### Development Environment
- Local Docker containers
- Hot reload for frontend/backend
- Local blockchain simulation (Hardhat/Ganache)

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Image Optimization**: Next.js Image component with WebP
- **Caching**: Service Worker for offline functionality
- **Bundle Analysis**: Webpack Bundle Analyzer integration

### Backend Optimization
- **Connection Pooling**: Database connection reuse
- **Caching Strategy**: Redis for frequently accessed data
- **Rate Limiting**: Token bucket algorithm implementation
- **Async Processing**: Queue-based job processing

### Database Optimization
- **Indexing Strategy**: Optimized indexes for query patterns
- **Query Optimization**: Efficient SQL queries with EXPLAIN
- **Connection Pooling**: PgBouncer for connection management
- **Read Replicas**: Separate read/write workloads

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Sentry for error reporting
- **Performance Monitoring**: New Relic APM
- **Custom Metrics**: Business KPI tracking
- **Health Checks**: Automated endpoint monitoring

### Infrastructure Monitoring
- **System Metrics**: CPU, memory, disk usage
- **Network Monitoring**: Request/response times
- **Log Aggregation**: ELK stack for centralized logging
- **Alerting**: PagerDuty integration for critical alerts

## Security Measures

### Application Security
- **Input Validation**: Comprehensive input sanitization
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Token-based CSRF prevention
- **Secure Headers**: OWASP recommended headers

### Infrastructure Security
- **Network Security**: VPC isolation and security groups
- **Access Control**: IAM roles and policies
- **Encryption**: TLS 1.3 for all communications
- **Secrets Management**: AWS Secrets Manager integration

## Scalability Strategy

### Horizontal Scaling
- **Load Balancing**: Auto-scaling groups
- **Database Sharding**: Multi-tenant database design
- **CDN Integration**: CloudFront for static assets
- **Microservices**: Service decomposition for independent scaling

### Performance Optimization
- **Caching Layers**: Multi-level caching strategy
- **Database Optimization**: Query optimization and indexing
- **Asset Optimization**: Minification and compression
- **Lazy Loading**: Component and route-based lazy loading

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with Point-in-Time recovery
- **File Backups**: S3 versioning for uploaded assets
- **Configuration Backups**: Infrastructure as Code versioning
- **Cross-region Replication**: Multi-region data replication

### Recovery Procedures
- **RTO/RPO**: 4-hour RTO, 1-hour RPO targets
- **Failover Strategy**: Multi-region active-passive setup
- **Data Recovery**: Automated restore procedures
- **Communication Plan**: Stakeholder notification protocols