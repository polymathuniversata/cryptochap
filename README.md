# 🔗 CryptoChap
### WhatsApp-native USDC on Base

*Send, receive, and buy USDC on Base network through WhatsApp chat*

[![Base Network](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=ethereum&logoColor=white)](https://base.org)
[![USDC](https://img.shields.io/badge/USDC-2775CA?style=for-the-badge&logo=centre&logoColor=white)](https://centre.io)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com)
[![Security: AAA](https://img.shields.io/badge/Security-AAA-green)](https://cryptochap.dev/security)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📁 Project Structure

```
cryptochap/
├── frontend/                    # Next.js React application
│   ├── app/                    # Next.js App Router
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utility libraries
│   └── types/                  # TypeScript type definitions
├── backend/                    # Express.js API server with TypeScript
│   ├── src/
│   │   ├── config/             # Configuration management
│   │   ├── controllers/        # Route handlers (7 controllers)
│   │   │   ├── api.ts          # Legacy API routes
│   │   │   ├── index.ts        # Route index
│   │   │   ├── system.ts       # Health, metrics, docs
│   │   │   ├── users.ts        # User management
│   │   │   ├── wallets.ts      # Wallet operations
│   │   │   ├── transactions.ts # Transaction handling
│   │   │   └── whatsapp.ts     # WhatsApp webhooks
│   │   ├── middleware/         # Security & validation (4 middlewares)
│   │   │   ├── validation.ts   # Input validation (Joi)
│   │   │   ├── security.ts     # Security headers (CSP, HSTS)
│   │   │   ├── rateLimiter.ts  # Rate limiting
│   │   │   └── errorHandler.ts # Error handling
│   │   ├── services/           # Business logic (9 services)
│   │   │   ├── blockchain.service.ts      # Base network operations
│   │   │   ├── wallet-derivation.service.ts # HD wallet derivation
│   │   │   ├── whatsapp-engine.service.ts  # Message processing
│   │   │   ├── monitoring.service.ts       # Performance tracking
│   │   │   ├── database-backup.service.ts  # Backup automation
│   │   │   ├── logging.service.ts          # Structured logging
│   │   │   ├── wallet.service.ts           # Wallet management
│   │   │   ├── token-management.service.ts # Token operations
│   │   │   └── whatsapp.service.ts         # WhatsApp integration
│   │   ├── utils/              # Utility functions
│   │   └── docs/               # API documentation
├── contracts/                  # Smart contracts (Solidity)
│   ├── contracts/
│   │   ├── CryptoChapWallet.sol # Main wallet contract
│   │   └── MockERC20.sol        # Test token
│   └── test/                   # Contract tests
├── tests/                      # Integration tests
├── deployments/                # Deployment configurations
├── docs/                       # Documentation
└── scripts/                    # Build and deployment scripts
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context + Custom Hooks
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for sessions and rate limiting
- **Blockchain**: ethers.js v6 for Base network
- **Validation**: Joi for input validation
- **Logging**: Winston for structured logging
- **Testing**: Jest with comprehensive coverage

### Blockchain
- **Network**: Base (Ethereum Layer 2)
- **Tokens**: USDC, ETH
- **Smart Contracts**: Solidity with OpenZeppelin
- **Wallet**: HD wallet derivation (BIP-44)
- **RPC**: Configurable provider endpoints

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Build Tools**: TypeScript, ESLint, Prettier
- **Testing**: Jest, Playwright
- **Monitoring**: Custom metrics and alerting

## 📡 API Endpoints

### System Endpoints
- `GET /api/system/health` - Health check with database status
- `GET /api/system/metrics` - Performance and system metrics
- `GET /api/docs` - API documentation overview
- `GET /api/docs/openapi.json` - OpenAPI 3.0 specification
- `GET /api/docs/errors` - Comprehensive error code reference

### User Management
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user information
- `POST /api/users` - Create new user (WhatsApp integration)
- `DELETE /api/users/{id}` - Soft delete user

### Wallet Management
- `GET /api/wallets/{id}` - Get wallet information
- `POST /api/wallets` - Create new wallet
- `PUT /api/wallets/{id}/balance` - Update wallet balance
- `DELETE /api/wallets/{id}` - Deactivate wallet (soft delete)
- `GET /api/users/{userId}/wallets` - Get user wallets

### Transaction Management
- `GET /api/transactions/{id}` - Get transaction details
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/{id}/status` - Update transaction status
- `GET /api/users/{userId}/transactions` - Get user transaction history
- `GET /api/wallets/{walletId}/transactions` - Get wallet transaction history

### WhatsApp Integration
- `GET /whatsapp/webhook` - WhatsApp webhook verification
- `POST /whatsapp/webhook` - WhatsApp message processing
- `POST /whatsapp/webhook/status` - WhatsApp status updates
- `POST /api/whatsapp/send` - Send WhatsApp message (testing)
- `POST /api/whatsapp/templates` - Send WhatsApp templates
- `GET /api/whatsapp/status` - WhatsApp configuration status
- `GET /api/whatsapp/health` - WhatsApp health check

## 🤖 WhatsApp Commands

Users can interact with CryptoChap using these commands:

### Core Commands
- `balance` - Check wallet balance (ETH & USDC)
- `send AMOUNT ADDRESS` - Transfer USDC to address
- `receive` - Get receiving address
- `help` - Show available commands

### Advanced Commands
- `status` - Check network status and gas prices
- `wallet` - Get detailed wallet information
- `network` - View Base network information
- `gas` - Check current gas prices

### Interactive Features
- Button replies for quick actions
- Template messages for formatted responses
- Real-time transaction updates
- Error handling with helpful messages

## 🛡️ Security Features

CryptoChap implements enterprise-grade security measures:

### Input Validation & Sanitization
- **Joi-based validation** with comprehensive schemas for all endpoints
- **Security-focused input sanitization** to prevent injection attacks
- **Suspicious pattern detection** for malicious input
- **Rate limiting** (100 req/15min global, 10 req/min for sensitive endpoints)

### Content Security Policy (CSP)
- **Production-ready CSP headers** to prevent XSS attacks
- **API-specific security headers** for enhanced protection
- **Request ID middleware** for comprehensive request tracing
- **Strict Transport Security (HSTS)** for HTTPS enforcement

### Comprehensive Monitoring
- **Performance metrics tracking** with automatic alerting
- **Memory usage monitoring** with configurable thresholds
- **Health check endpoints** for system status
- **Error tracking and categorization**
- **Database backup automation** with retention policies

### Blockchain Security
- **HD wallet derivation** with secure key management
- **Transaction validation** before execution
- **Gas estimation** with safety buffers
- **Address format validation** using ethers.js
- **Smart contract security** with OpenZeppelin standards

### Database Security
- **Automated backup system** with configurable retention
- **Parameterized queries** to prevent SQL injection
- **Connection pooling** for optimal performance
- **SSL/TLS encryption** for database connections
- **Data validation** at application and database levels

## 🔐 Authentication & Authorization

### Security Headers
All API responses include comprehensive security headers:
- **Content-Security-Policy** - Prevents XSS attacks
- **Strict-Transport-Security** - Enforces HTTPS
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing
- **X-XSS-Protection** - Enables XSS filtering

### Rate Limiting
- **Global rate limiting:** 100 requests per 15 minutes
- **Strict rate limiting:** 10 requests per minute for sensitive endpoints
- **IP-based tracking** with automatic blocking

### Input Validation
- **Comprehensive validation schemas** for all endpoints
- **Security-focused sanitization** of all user input
- **Suspicious pattern detection** for malicious payloadsts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/polymathuniversata/cryptochap.git
   cd cryptochap
   ```

2. **Setup environment variables**
   ```bash
   cp frontend/.env.local.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

3. **Start development environment**
   ```bash
   # Start dependencies (PostgreSQL, Redis)
   docker-compose up -d

   # Install frontend dependencies
   cd frontend && npm install

   # Install backend dependencies
   cd ../backend && npm install

   # Start development servers
   cd ../backend && npm run dev &
   cd ../frontend && npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs
   - Health Check: http://localhost:3001/api/system/health
   - Metrics: http://localhost:3001/api/system/metrics

## 🛠️ Development

### Available Scripts

#### Frontend (`cd frontend`)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
```

#### Backend (`cd backend`)
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/unit/wallet.test.ts
```

## 📚 Documentation

- [📖 System Architecture](docs/architecture.md)
- [👥 User Flows](docs/user-flows.md)
- [📋 Sprint Planning](docs/sprint-planning.md)
- [🔧 System Design](docs/system-design.md)
- [🧪 Testing Strategy](docs/testing-strategy.md)
- [🚀 Deployment Guide](deployments/deployment-guide.md)
- [📱 WhatsApp Setup](docs/WHATSAPP_SETUP_GUIDE.md)
- [🔧 WhatsApp Architecture](docs/WHATSAPP_ARCHITECTURE.md)

## ✨ What you get

🚀 **WhatsApp-first experience** — Native chat interface for crypto operations  
💰 **Auto wallet generation** — Unique wallet per user (custodial or non-custodial)  
⚡ **Base network integration** — Fast, low-cost USDC transfers  
� **Seamless onramp** — Buy crypto with fiat, mobile money, or cards  
📱 **Mobile money support** — M-Pesa, Airtel Money, Tigo Pesa integration  
� **Enterprise security** — Webhook architecture with proper validation


## 📝 Environment Variables

Create a `.env` file with the following configuration:

```env
# Database Configuration
POSTGRES_PASSWORD=your_secure_postgres_password_here

# WhatsApp provider: twilio | meta
WHATSAPP_PROVIDER=twilio

# Twilio (if using Twilio WhatsApp API)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+1xxxxxxxxxx

# Meta WhatsApp Cloud API (if using Meta)
META_WHATSAPP_TOKEN=EAAG... 
META_VERIFY_TOKEN=your_webhook_verify_token
META_PHONE_NUMBER_ID=1xxxxxxxxxxxxxxx
META_APP_ID=xxxxxxxxxxxxxxx
META_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Chain config
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-key
BASE_CHAIN_ID=8453
USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Signing
OPERATOR_MNEMONIC="seed phrase words ..."
# or
OPERATOR_PRIVATE_KEY=0x...

# Onramp (choose one or more)
ONRAMP_PROVIDER=coinbase
COINBASE_ONRAMP_APP_ID=your_app_id
MOONPAY_API_KEY=pk_test_...
TRANSAK_API_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# FX and pricing (for mobile money)
BASE_USD_ORACLE=coingecko
SPREAD_BPS=100                  # 1% spread
MOBILE_MONEY_FEE_FLAT=0.30
MOBILE_MONEY_FEE_BPS=150        # 1.5%

# M-Pesa (Daraja)
MPESA_ENV=sandbox               # sandbox | production
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
MPESA_CALLBACK_BASE_URL=https://your.app/webhooks/mpesa

# Airtel Money
AIRTEL_ENV=sandbox
AIRTEL_CLIENT_ID=...
AIRTEL_CLIENT_SECRET=...
AIRTEL_COUNTRY=KE               # or TZ, UG, etc.
AIRTEL_CURRENCY=KES
AIRTEL_CALLBACK_BASE_URL=https://your.app/webhooks/airtel

# Tigo Pesa
TIGOPESA_ENV=sandbox
TIGOPESA_CLIENT_ID=...
TIGOPESA_CLIENT_SECRET=...
TIGOPESA_CALLBACK_BASE_URL=https://your.app/webhooks/tigo
```

## 💳 Onramp Integration

Reply to "buy" or "deposit" with a provider link prefilled with:

- **Asset:** USDC
- **Network:** Base
- **Destination:** User's wallet address
- **Amount:** Optional fiat amount (e.g., USD $50)

### Provider Examples

**Coinbase Onramp (hosted flow)**
- Prefill address and Base network using provider-supported parameters
- Docs: https://docs.cloud.coinbase.com

**MoonPay**
```
https://buy.moonpay.com?apiKey=YOUR_KEY&currencyCode=usdc&walletAddress=0xUSER&baseCurrencyCode=usd&baseCurrencyAmount=50&chain=base
```

**Transak**
```
https://global.transak.com/?apiKey=YOUR_KEY&cryptoCurrency=USDC&network=base&walletAddress=0xUSER&disableWalletAddressForm=true
```

**Stripe Crypto Onramp**
- Create server-side onramp session, get session URL/client secret
- Docs: https://stripe.com/docs/crypto/onramp

💡 **Tip:** If a provider requires server-side token/signature, expose an endpoint (e.g., `/onramp/session?address=0xUSER&amount=50`) and return the redirect URL.

## 📱 Mobile Money Integration

Mobile money rails power both onramp (fiat → USDC) and offramp (USDC → fiat) flows.

### Supported Providers

**M-Pesa (Daraja API)**
- STK Push (C2B): prompt user approval on phone
- B2C/B2B payouts: send funds to mobile wallet
- Docs: https://developer.safaricom.co.ke/

**Airtel Money Open API**
- Collections (C2B) and Disbursements (B2C)
- Docs: https://developers.airtel.africa/

**Tigo Pesa**
- Collections and Payouts APIs via Tigo Business
- Docs via operator portal/regional aggregator

### Flow Patterns

**Onramp (mobile money → USDC):**
1. User: `buy 20 usdc via mpesa`
2. Bot: Initiates C2B/Checkout (STK Push) for equivalent fiat + fees
3. Provider: Sends payment callback → server verifies payment
4. Bot: Credits USDC by transferring from treasury to user's address
5. Bot: Replies with transaction hash and receipt

**Offramp (USDC → mobile money):**
1. User: `cashout 15 usdc to mpesa +2547xxxxxxx`
2. Bot: Confirms quote (FX + fee), asks for YES confirmation
3. Bot: Swaps USDC→fiat liquidity, calls B2C payout API
4. Provider: Callback confirms payout success/failure

### Example Commands
- `buy 20 usdc via mpesa`
- `buy 50 usdc via airtel`
- `cashout 15 usdc to mpesa +254712345678`

### API Endpoints
- `POST /payments/quote` — FX quotes with fees
- `POST /payments/mpesa/collect` — STK Push trigger
- `POST /payouts/mpesa` — Mobile money disbursement
- `POST /webhooks/mpesa` — Payment/payout callbacks

## 💬 Message Commands

| Command | Function |
|---------|----------|
| `help` | Returns available commands |
| `address` | Returns user's deposit address on Base |
| `deposit` / `buy [amount]` | Returns onramp link + instructions |
| `balance` | Shows USDC and ETH (gas) balance |
| `send 5 USDC to 0xabc123…` | Transfers tokens on-chain |
| `send 2 USDC to +15551234567` | Resolves phone → wallet, then transfers |
| `history` | Last N transfers (from USDC Transfer events) |

### Send Confirmation Flow
1. **User:** `send 10 USDC to 0xabc…`
2. **Bot:** `Confirm sending 10 USDC (fee ~0.000x ETH)? Reply YES within 2 minutes.`
3. **User:** `YES`
4. **Bot:** `Submitted tx 0x… (link to basescan.org)`

## 🛠️ Server Implementation

```typescript
import express from 'express'
import { ethers } from 'ethers'

const app = express()
app.use(express.json())

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY!, provider)
const USDC = new ethers.Contract(
	process.env.USDC_CONTRACT!,
	[
		'function balanceOf(address) view returns (uint256)',
		'function decimals() view returns (uint8)',
		'function transfer(address to, uint256 amount) returns (bool)'
	],
	wallet
)

function getUserAddressFromPhone(phone: string): string {
	// TODO: implement deterministic derivation or DB lookup
	return '0x...'
}

app.post('/webhook', async (req, res) => {
	const { from, body } = parseIncomingMessage(req)

	if (/^address$/i.test(body)) {
		const addr = getUserAddressFromPhone(from)
		return res.json(replyText(`Your Base USDC address:\n${addr}`))
	}

	if (/^balance$/i.test(body)) {
		const addr = getUserAddressFromPhone(from)
		const [usdc, dec] = await Promise.all([
			USDC.balanceOf(addr),
			USDC.decimals()
		])
		const eth = await provider.getBalance(addr)
		return res.json(
			replyText(
				`USDC: ${ethers.formatUnits(usdc, dec)}\nBase ETH: ${ethers.formatEther(eth)}`
			)
		)
	}

	// Additional command handlers...
	return res.json(replyText('Try: address | balance | deposit | send 5 USDC to 0x...'))
})

app.listen(3000, () => console.log('Bot listening on :3000'))
```

## 🚀 Deployment & Security

### Webhook Setup
- **HTTPS Required:** Use trusted certificate (ngrok for local dev)
- **Idempotency:** Dedupe messages, handle provider retries
- **Logging:** Transaction hashes and message IDs for auditing

### Security Best Practices
- **Key Management:** Use HSM/KMS (AWS KMS, Azure Key Vault)
- **Compliance:** KYC/AML via onramp providers
- **Rate Limiting:** Per-user velocity limits, geo/IP screening
- **Privacy:** Encrypt phone numbers (PII) at rest

### Operational Notes
- Treasury wallet needs USDC and fiat float for settlement
- Daily reconciliation of provider statements vs on-chain activity
- Implement idempotency keys for collect/payout requests
- Apply per-user/daily limits and KYC thresholds
- Store quotes with expiry (2-5 minutes) for FX volatility

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Gas Errors** | Fund signing wallet with Base ETH |
| **USDC Transfer Failed** | Verify contract address, decimals, user balance |
| **Webhook Not Firing** | Check provider console logs, HTTPS URL |
| **Onramp Link Issues** | Verify provider parameters, allowlists, app IDs |
| **Mobile Money Fails** | Check phone format, wallet balance, shortcode |
| **Payout Rejected** | Verify KYC limits, daily caps, country/currency |

## 📚 Documentation

CryptoChap includes comprehensive documentation covering all aspects of the platform:

### 📖 Core Documentation
- **[Architecture Guide](docs/architecture.md)** - System architecture and design patterns
- **[Implementation Guide](docs/implementation-guide.md)** - Complete feature overview and setup instructions
- **[Service Breakdown](docs/service-breakdown.md)** - Detailed analysis of all 9 backend services
- **[API Documentation](docs/api-documentation.md)** - Complete REST API reference with examples

### 🛠️ Technical Documentation
- **[System Design](docs/system-design.md)** - Technical specifications and design decisions
- **[Testing Strategy](docs/testing-strategy.md)** - Testing approach and coverage requirements
- **[User Flows](docs/user-flows.md)** - User interaction patterns and workflows

### 📱 WhatsApp Integration
- **[WhatsApp Setup Guide](docs/WHATSAPP_SETUP_GUIDE.md)** - Complete WhatsApp Business API setup
- **[WhatsApp Instructions](docs/WHATSAPP_INSTRUCTIONS.md)** - Integration and configuration steps
- **[WhatsApp Architecture](docs/WHATSAPP_ARCHITECTURE.md)** - WhatsApp system design
- **[WhatsApp Checklist](docs/WHATSAPP_CHECKLIST.md)** - Setup verification checklist

### 🚀 Deployment & Operations
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Sprint Planning](docs/sprint-planning.md)** - Development roadmap and milestones
- **[Sprint 1 Report](docs/sprint1-completion-report.md)** - Completed features and achievements

---

<div align="center">

**Built for the future of accessible crypto** 🌍

*Made with ❤️ for global financial inclusion*

</div>
