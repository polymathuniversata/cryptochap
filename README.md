# cryptoChap — WhatsApp USDC on Base

Send and receive USDC on the Base network directly from WhatsApp. Includes a WhatsApp-native onramp flow so users can buy USDC and have it delivered to their wallet address—without leaving the chat.


## What you get

- WhatsApp chat interface for on-chain actions
- Unique wallet per WhatsApp user (derived or custodial strategy)
- Base network support (mainnet, chainId 8453)
- USDC transfers (Base Network) and balance checks
- Optional onramp link generation (Coinbase, MoonPay, Transak, Stripe, etc.)
- Mobile money on/off-ramp (M-Pesa, Airtel Money, Tigo Pesa) design patterns
- Webhook-based architecture (Twilio WhatsApp API or WhatsApp Cloud API)


## How it works (architecture)

1. User messages your WhatsApp number (e.g., “balance”, “address”, “send 5 USDC to 0x…”, “buy 50 USDC”).
2. WhatsApp provider (Twilio or Meta Cloud API) sends a webhook to your server.
3. Your bot maps phone → wallet, then:
	 - For balance/history: reads from Base via JSON-RPC (ethers/viem).
	 - For send: builds and signs an ERC-20 transfer transaction for USDC on Base, pays gas in ETH on Base.
	 - For onramp: replies with a provider deep link prefilled with the user’s wallet address and Base network.
4. Bot replies to the user with confirmations, links, or errors.


## WhatsApp integration options

You only need one of the following:

- Twilio WhatsApp Business API
	- Fast to start; inbound messages via a single webhook.
	- Configure a WhatsApp Business sender, then set the webhook URL in Twilio Console.
- WhatsApp Cloud API (Meta)
	- Direct from Meta; supports webhooks, message templates, media, etc.
	- Create a WhatsApp Business App, verify the token, and set the webhook subscription.

Your webhook should parse messages and normalize commands like:

- help
- address (shows deposit address)
- deposit / buy [amount] (returns onramp link and/or instructions)
- balance
- send <amount> USDC to <0xAddress | +Phone>
- history


## Base and USDC specifics

- Chain: Base mainnet (chainId 8453)
- RPC: Use a reliable provider (Alchemy, Infura, QuickNode, Ankr, or Base’s public endpoints)
- USDC contract (Base mainnet): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Gas: Paid in ETH on Base. Make sure your signing wallet has ETH for gas.
- Testnet: Base Sepolia is available for dev; USDC may not have an official faucet—use a mock token or provider-specific test assets.


## Wallet custody strategies

Pick one strategy and note the trade-offs:

1) Custodial HD wallet (MVP-friendly)
- Derive per-user addresses from a master mnemonic: m/44'/60'/0'/0/{userIndex}
- Pros: simple UX, instant sends. Cons: you custody keys; implement strict security.

2) Smart account / account abstraction
- Gas sponsorship, programmable policies, social recovery.
- Requires bundler/paymaster infra and a signing/auth model for WhatsApp.

3) External-wallet linking (non-custodial)
- User provides their own address; bot only reads balances and generates onramp links. For “send”, bot can only craft/share a pre-signed transaction if keys are elsewhere.


## Environment variables

Create a .env (example keys; adjust for your provider choices):

```
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
```


## Onramp flows from WhatsApp

Reply to “buy” or “deposit” with a provider link prefilled with:

- asset: USDC
- network: Base
- destination wallet address: the user’s deposit address
- optional fiat amount (e.g., USD $50)

Provider examples (parameters may change—consult provider docs):

- Coinbase Onramp (hosted flow)
	- Prefill address and Base network using provider-supported parameters; typically you’ll pass a destination wallets payload and app ID.
	- Docs: https://docs.cloud.coinbase.com 

- MoonPay
	- Example: `https://buy.moonpay.com?apiKey=YOUR_KEY&currencyCode=usdc&walletAddress=0xUSER&baseCurrencyCode=usd&baseCurrencyAmount=50&chain=base`

- Transak
	- Example: `https://global.transak.com/?apiKey=YOUR_KEY&cryptoCurrency=USDC&network=base&walletAddress=0xUSER&disableWalletAddressForm=true`

- Stripe Crypto Onramp
	- Create a server-side onramp session, get a session URL/client secret, then send that link in WhatsApp. Docs: https://stripe.com/docs/crypto/onramp

Tip: If a provider requires a server-side token/signature, expose an endpoint (e.g., /onramp/session?address=0xUSER&amount=50) and return the redirect URL to share in chat.


## Mobile money on/off-ramp (M‑Pesa, Airtel Money, Tigo Pesa)

Mobile money rails can power both onramp (fiat → USDC on Base) and offramp (USDC → fiat to wallet). Integrate one or more providers depending on your target markets.

Supported APIs (examples; confirm regional availability and business onboarding):

- M‑Pesa (Daraja API)
	- STK Push (C2B): prompt user to approve a debit on their phone.
	- B2C/B2B payouts: send funds to a mobile money wallet.
	- Docs: https://developer.safaricom.co.ke/
- Airtel Money Open API
	- Collections (C2B) and Disbursements (B2C).
	- Docs: https://developers.airtel.africa/
- Tigo Pesa
	- Collections and Payouts APIs (via Tigo Business). Docs via operator portal/regional aggregator.

Common flow patterns:

Onramp (mobile money → USDC):
1) User: buy 20 usdc via mpesa
2) Bot: Initiates C2B/Checkout (STK Push or payment link) for equivalent fiat amount + fees.
3) Provider: Sends payment callback → server verifies and records payment.
4) Bot: Mints/credits USDC by transferring from treasury to user’s Base address.
5) Bot: Replies with on-chain tx hash and receipt to the user.

Offramp (USDC → mobile money):
1) User: cashout 15 usdc to mpesa +2547xxxxxxx
2) Bot: Confirms quote (FX + fee), asks for YES.
3) Bot: Swaps USDC→local fiat liquidity (internal or via partner), then calls B2C payout API.
4) Provider: Callback confirms payout success/failure; bot updates status in chat.

Commands (examples):
- buy 20 usdc via mpesa
- buy 50 usdc via airtel
- buy 10 usdc via tigo
- cashout 15 usdc to mpesa +254712345678
- cashout 25 usdc to airtel +2556xxxxxxx

Environment variables (examples):

```
# FX and pricing
BASE_USD_ORACLE=coingecko
SPREAD_BPS=100                  # 1% spread
MOBILE_MONEY_FEE_FLAT=0.30
MOBILE_MONEY_FEE_BPS=150        # 1.5%

# M‑Pesa (Daraja)
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

Endpoints you’ll expose:

- POST /payments/quote — returns fiat amount for requested USDC (or vice versa), with FX and fees.
- POST /payments/mpesa/collect — triggers STK Push; returns checkout ID.
- POST /payments/airtel/collect — initiates Airtel collection.
- POST /payouts/mpesa — disbursement to phone number.
- POST /payouts/airtel — disbursement to phone number.
- POST /webhooks/mpesa — payment/payout callbacks.
- POST /webhooks/airtel — payment/payout callbacks.
- POST /webhooks/tigo — payment/payout callbacks.

Operational notes:
- You’ll need a treasury wallet of USDC and fiat float for fast settlement.
- Reconcile provider statements with on-chain activity daily.
- Implement idempotency keys for collect/payout requests and webhook handlers.
- Apply per-user and per-day limits; enforce KYC thresholds per provider rules.
- Store quotes with expiry (e.g., 2–5 minutes) to handle FX volatility.


## Message command design (examples)

- help → returns available commands
- address → returns the user’s deposit address on Base
- deposit / buy [amount] → returns an onramp link (and instructions to send USDC directly if they already have it)
- balance → shows USDC and ETH( Base gas) balance
- send 5 USDC to 0xabc123… → transfers tokens on-chain
- send 2 USDC to +15551234567 → resolves phone → wallet (if known), then transfers
- history → last N transfers (read from USDC Transfer events)

Implement a confirm step for “send” to prevent mistakes:

1) User: send 10 USDC to 0xabc…
2) Bot: Confirm sending 10 USDC (fee ~0.000x ETH)? Reply YES within 2 minutes.
3) User: YES
4) Bot: Submitted tx 0x… (link to basescan.org)


## Minimal server outline (Node + Express + ethers v6)

This outline illustrates the core building blocks you’ll implement:

```ts
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

// Map phone → derived address (MVP: simple in-memory or DB). For custodial, you might derive from mnemonic.
function getUserAddressFromPhone(phone: string): string {
	// TODO: implement deterministic derivation or DB lookup
	return '0x...'
}

app.post('/webhook', async (req, res) => {
	// 1) Verify signature/token from Twilio or Meta
	// 2) Normalize inbound text
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

	const sendMatch = body.match(/^send\s+(\d+(?:\.\d+)?)\s+usdc\s+to\s+(0x[0-9a-fA-F]{40}|\+\d{6,})/i)
	if (sendMatch) {
		const [, amountStr, toRaw] = sendMatch
		const to = toRaw.startsWith('+') ? getUserAddressFromPhone(toRaw) : toRaw
		const dec = await USDC.decimals()
		const amount = ethers.parseUnits(amountStr, dec)
		// Optional: send a confirmation message first
		const tx = await USDC.transfer(to, amount)
		const receipt = await tx.wait()
		return res.json(replyText(`Sent ${amountStr} USDC. Tx: ${receipt?.hash}`))
	}

	if (/^(deposit|buy)(\s+\d+(?:\.\d+)?)?$/i.test(body)) {
		const addr = getUserAddressFromPhone(from)
		const amt = (body.split(/\s+/)[1]) || '50'
		const link = buildOnrampLink({ provider: process.env.ONRAMP_PROVIDER!, address: addr, amount: amt })
		return res.json(
			replyText(
				`Buy USDC on Base and deliver to your address:\n${link}\nYou can also send USDC directly to your address.`
			)
		)
	}

	return res.json(replyText('Try: address | balance | deposit | send 5 USDC to 0x...'))
})

app.listen(3000, () => console.log('Bot listening on :3000'))

// Helpers (provider-specific parsers and responders)
function parseIncomingMessage(req: any) { /* ... */ return { from: '+15551234567', body: 'balance' } }
function replyText(text: string) { /* ... */ return { ok: true } }
function buildOnrampLink({ provider, address, amount }: { provider: string, address: string, amount: string }) {
	if (provider === 'moonpay') return `https://buy.moonpay.com?apiKey=KEY&currencyCode=usdc&walletAddress=${address}&baseCurrencyCode=usd&baseCurrencyAmount=${amount}&chain=base`
	if (provider === 'transak') return `https://global.transak.com/?apiKey=KEY&cryptoCurrency=USDC&network=base&walletAddress=${address}&disableWalletAddressForm=true`
	if (provider === 'coinbase') return `https://onramp.coinbase.com?address=${address}&asset=USDC&network=base&appId=APP_ID`
	return `https://example.com/onramp?address=${address}&amount=${amount}`
}
```

Notes:
- Use proper verification for Twilio/Meta signatures before trusting inbound messages.
<div align="center">

# 🔗 cryptoChap
### WhatsApp-native USDC on Base

*Send, receive, and buy USDC on Base network through WhatsApp chat*

[![Base Network](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=ethereum&logoColor=white)](https://base.org)
[![USDC](https://img.shields.io/badge/USDC-2775CA?style=for-the-badge&logo=centre&logoColor=white)](https://centre.io)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com)

</div>

---

## ✨ What you get

🚀 **WhatsApp-first experience** — Native chat interface for crypto operations  
💰 **Auto wallet generation** — Unique wallet per user (custodial or non-custodial)  
⚡ **Base network integration** — Fast, low-cost USDC transfers  
🛒 **Seamless onramp** — Buy crypto with fiat, mobile money, or cards  
📱 **Mobile money support** — M-Pesa, Airtel Money, Tigo Pesa integration  
🔐 **Enterprise security** — Webhook architecture with proper validation  

---

## 🏗️ How it works

```
User message → WhatsApp API → Your server → Base network → Response
```

1. **📥 Receive** — User sends command via WhatsApp
2. **🔍 Process** — Bot parses intent and maps phone to wallet
3. **⚡ Execute** — Perform on-chain action or generate payment link
4. **📤 Respond** — Send confirmation, links, or transaction details

---

## 🔧 Integration options

### WhatsApp Providers
| Provider | Setup Time | Features |
|----------|------------|----------|
| **Twilio** | 🟢 Fast | Single webhook, business API |
| **Meta Cloud API** | 🟡 Medium | Templates, media, direct integration |

### Supported Commands
- `💰 balance` — Check USDC and ETH balance
- `📍 address` — Get your deposit address  
- `💳 buy 50` — Purchase USDC with fiat/mobile money
- `📤 send 10 USDC to 0x...` — Transfer to address or phone
- `📋 history` — View recent transactions


## What you get

- WhatsApp chat interface for on-chain actions
- Unique wallet per WhatsApp user (derived or custodial strategy)
- Base network support (mainnet, chainId 8453)
- USDC transfers (ERC-20) and balance checks
- Optional onramp link generation (Coinbase, MoonPay, Transak, Stripe, etc.)
- Mobile money on/off-ramp (M-Pesa, Airtel Money, Tigo Pesa) design patterns
- Webhook-based architecture (Twilio WhatsApp API or WhatsApp Cloud API)


## How it works (architecture)

1. User messages your WhatsApp number (e.g., “balance”, “address”, “send 5 USDC to 0x…”, “buy 50 USDC”).
2. WhatsApp provider (Twilio or Meta Cloud API) sends a webhook to your server.
3. Your bot maps phone → wallet, then:
	 - For balance/history: reads from Base via JSON-RPC (ethers/viem).
	 - For send: builds and signs an ERC-20 transfer for USDC on Base, pays gas in ETH on Base.
	 - For onramp: replies with a provider deep link prefilled with the user’s wallet address and Base network.
4. Bot replies to the user with confirmations, links, or errors.


## WhatsApp integration options

You only need one of the following:

- Twilio WhatsApp Business API
	- Fast to start; inbound messages via a single webhook.
	- Configure a WhatsApp Business sender, then set the webhook URL in Twilio Console.
- WhatsApp Cloud API (Meta)
	- Direct from Meta; supports webhooks, message templates, media, etc.
	- Create a WhatsApp Business App, verify the token, and set the webhook subscription.

Your webhook should parse messages and normalize commands like:

- help
- address (shows deposit address)
- deposit / buy [amount] (returns onramp link and/or instructions)
- balance
- send <amount> USDC to <0xAddress | +Phone>
- history


## Base and USDC specifics

- Chain: Base mainnet (chainId 8453)
- RPC: Use a reliable provider (Alchemy, Infura, QuickNode, Ankr, or Base’s public endpoints)
- USDC contract (Base mainnet): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Gas: Paid in ETH on Base. Make sure your signing wallet has ETH for gas.
- Testnet: Base Sepolia is available for dev; USDC may not have an official faucet—use a mock token or provider-specific test assets.


## Wallet custody strategies

Pick one strategy and note the trade-offs:

1) Custodial HD wallet (MVP-friendly)
- Derive per-user addresses from a master mnemonic: m/44'/60'/0'/0/{userIndex}
- Pros: simple UX, instant sends. Cons: you custody keys; implement strict security.

2) Smart account / account abstraction
- Gas sponsorship, programmable policies, social recovery.
- Requires bundler/paymaster infra and a signing/auth model for WhatsApp.

3) External-wallet linking (non-custodial)
- User provides their own address; bot only reads balances and generates onramp links. For “send”, bot can only craft/share a pre-signed transaction if keys are elsewhere.


---

## ⚙️ Base Network Configuration

| Parameter | Value |
|-----------|-------|
| **Chain ID** | `8453` (Base Mainnet) |
| **USDC Contract** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Gas Token** | ETH on Base |
| **RPC Providers** | Alchemy, Infura, QuickNode, Ankr |

---

## 🏦 Wallet Strategies

### 🔐 Custodial (Recommended for MVP)
- **Pros:** Simple UX, instant transactions
- **Implementation:** HD derivation from master seed
- **Security:** Requires HSM/KMS for production

### 🤖 Smart Accounts  
- **Pros:** Gas sponsorship, programmable policies
- **Implementation:** Account abstraction with bundlers
- **Use case:** Advanced features, social recovery

### 🔗 Non-custodial
- **Pros:** User controls keys
- **Implementation:** User provides wallet address
- **Limitation:** Read-only operations, external signing

---

## 🛒 Onramp Providers

### Credit Cards & Bank Transfers
| Provider | Regions | Integration |
|----------|---------|-------------|
| **Coinbase** | Global | Hosted widget |
| **MoonPay** | 160+ countries | API + widget |
| **Transak** | 100+ countries | Direct API |
| **Stripe** | 40+ countries | Onramp sessions |

### Mobile Money (Africa)
| Provider | Countries | Methods |
|----------|-----------|---------|
| **M-Pesa** | Kenya, Tanzania | STK Push, B2C |
| **Airtel Money** | 14 countries | Collections API |
| **Tigo Pesa** | East Africa | Business API |

---

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Clone and configure
git clone https://github.com/polymathuniversata/cryptochap
cd cryptochap
cp .env.example .env
```

### 2. Key Configuration
```env
# WhatsApp (choose one)
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Base Network
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-key
USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Security (use KMS in production)
OPERATOR_PRIVATE_KEY=0x...
```

### 3. Deploy & Test
```bash
# Start server
npm start

# Set webhook URL in provider dashboard
# Test with WhatsApp: "balance"
```

---

## 🔒 Security & Compliance

### 🛡️ Production Requirements
- **Key Management:** Use HSM/KMS (AWS KMS, Azure Key Vault)
- **Rate Limiting:** Per-user and global limits
- **KYC/AML:** Provider-enforced compliance
- **Data Privacy:** Encrypt PII, secure phone number handling

### ⚠️ Risk Considerations
- **Custody Risk:** You control user funds in custodial mode
- **Regulatory:** Comply with local financial regulations
- **Operational:** Monitor treasury balances and reconciliation

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Gas Errors** | Fund operator wallet with Base ETH |
| **Webhook Failures** | Verify HTTPS URL and signatures |
| **Mobile Money Fails** | Check phone format and provider limits |
| **Onramp Issues** | Validate provider parameters and allowlists |

---

## 📚 Resources

### 🔗 Essential Links
- [Base Network](https://base.org) — L2 documentation
- [BaseScan](https://basescan.org) — Block explorer
- [Twilio WhatsApp](https://www.twilio.com/whatsapp) — Messaging API
- [Meta Cloud API](https://developers.facebook.com/docs/whatsapp/) — Direct WhatsApp integration

### 🏗️ Development Tools
- [ethers.js](https://docs.ethers.org) — Ethereum library
- [Coinbase Onramp](https://docs.cloud.coinbase.com) — Crypto purchasing
- [M-Pesa API](https://developer.safaricom.co.ke/) — Mobile money integration

---

<div align="center">

**Built for the future of accessible crypto** 🌍

*Made with ❤️ for global financial inclusion*

</div>


## Onramp flows from WhatsApp

Reply to “buy” or “deposit” with a provider link prefilled with:

- asset: USDC
- network: Base
- destination wallet address: the user’s deposit address
- optional fiat amount (e.g., USD $50)

Provider examples (parameters may change—consult provider docs):

- Coinbase Onramp (hosted flow)
	- Prefill address and Base network using provider-supported parameters; typically you’ll pass a destination wallets payload and app ID.
	- Docs: https://docs.cloud.coinbase.com

- MoonPay
	- Example: `https://buy.moonpay.com?apiKey=YOUR_KEY&currencyCode=usdc&walletAddress=0xUSER&baseCurrencyCode=usd&baseCurrencyAmount=50&chain=base`

- Transak
	- Example: `https://global.transak.com/?apiKey=YOUR_KEY&cryptoCurrency=USDC&network=base&walletAddress=0xUSER&disableWalletAddressForm=true`

- Stripe Crypto Onramp
	- Create a server-side onramp session, get a session URL/client secret, then send that link in WhatsApp. Docs: https://stripe.com/docs/crypto/onramp

Tip: If a provider requires a server-side token/signature, expose an endpoint (e.g., /onramp/session?address=0xUSER&amount=50) and return the redirect URL to share in chat.


## Mobile money on/off-ramp (M-Pesa, Airtel Money, Tigo Pesa)

Mobile money rails can power both onramp (fiat → USDC on Base) and offramp (USDC → fiat to wallet). Integrate one or more providers depending on your target markets.

Supported APIs (examples; confirm regional availability and business onboarding):

- M-Pesa (Daraja API)
	- STK Push (C2B): prompt user to approve a debit on their phone.
	- B2C/B2B payouts: send funds to a mobile money wallet.
	- Docs: https://developer.safaricom.co.ke/
- Airtel Money Open API
	- Collections (C2B) and Disbursements (B2C).
	- Docs: https://developers.airtel.africa/
- Tigo Pesa
	- Collections and Payouts APIs (via Tigo Business). Docs via operator portal/regional aggregator.

Common flow patterns:

Onramp (mobile money → USDC):
1) User: buy 20 usdc via mpesa
2) Bot: Initiates C2B/Checkout (STK Push or payment link) for equivalent fiat amount + fees.
3) Provider: Sends payment callback → server verifies and records payment.
4) Bot: Mints/credits USDC by transferring from treasury to user’s Base address.
5) Bot: Replies with on-chain tx hash and receipt to the user.

Offramp (USDC → mobile money):
1) User: cashout 15 usdc to mpesa +2547xxxxxxx
2) Bot: Confirms quote (FX + fee), asks for YES.
3) Bot: Swaps USDC → local fiat liquidity (internal or via partner), then calls B2C payout API.
4) Provider: Callback confirms payout success/failure; bot updates status in chat.

Commands (examples):
- buy 20 usdc via mpesa
- buy 50 usdc via airtel
- buy 10 usdc via tigo
- cashout 15 usdc to mpesa +254712345678
- cashout 25 usdc to airtel +2556xxxxxxx

Environment variables (examples):

```env
# FX and pricing
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

Endpoints you’ll expose:

- POST /payments/quote — returns fiat amount for requested USDC (or vice versa), with FX and fees.
- POST /payments/mpesa/collect — triggers STK Push; returns checkout ID.
- POST /payments/airtel/collect — initiates Airtel collection.
- POST /payouts/mpesa — disbursement to phone number.
- POST /payouts/airtel — disbursement to phone number.
- POST /webhooks/mpesa — payment/payout callbacks.
- POST /webhooks/airtel — payment/payout callbacks.
- POST /webhooks/tigo — payment/payout callbacks.

Operational notes:
- You’ll need a treasury wallet of USDC and fiat float for fast settlement.
- Reconcile provider statements with on-chain activity daily.
- Implement idempotency keys for collect/payout requests and webhook handlers.
- Apply per-user and per-day limits; enforce KYC thresholds per provider rules.
- Store quotes with expiry (e.g., 2–5 minutes) to handle FX volatility.


## Message command design (examples)

- help → returns available commands
- address → returns the user’s deposit address on Base
- deposit / buy [amount] → returns an onramp link (and instructions to send USDC directly if they already have it)
- balance → shows USDC and ETH (Base gas) balance
- send 5 USDC to 0xabc123… → transfers tokens on-chain
- send 2 USDC to +15551234567 → resolves phone → wallet (if known), then transfers
- history → last N transfers (read from USDC Transfer events)

Implement a confirm step for “send” to prevent mistakes:

1) User: send 10 USDC to 0xabc…
2) Bot: Confirm sending 10 USDC (fee ~0.000x ETH)? Reply YES within 2 minutes.
3) User: YES
4) Bot: Submitted tx 0x… (link to basescan.org)


## Minimal server outline (Node + Express + ethers v6)

This outline illustrates the core building blocks you’ll implement:

```ts
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

// Map phone → derived address (MVP: simple in-memory or DB). For custodial, you might derive from mnemonic.
function getUserAddressFromPhone(phone: string): string {
	// TODO: implement deterministic derivation or DB lookup
	return '0x...'
}

app.post('/webhook', async (req, res) => {
	// 1) Verify signature/token from Twilio or Meta
	// 2) Normalize inbound text
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

	const sendMatch = body.match(/^send\s+(\d+(?:\.\d+)?)\s+usdc\s+to\s+(0x[0-9a-fA-F]{40}|\+\d{6,})/i)
	if (sendMatch) {
		const [, amountStr, toRaw] = sendMatch
		const to = toRaw.startsWith('+') ? getUserAddressFromPhone(toRaw) : toRaw
		const dec = await USDC.decimals()
		const amount = ethers.parseUnits(amountStr, dec)
		// Optional: send a confirmation message first
		const tx = await USDC.transfer(to, amount)
		const receipt = await tx.wait()
		return res.json(replyText(`Sent ${amountStr} USDC. Tx: ${receipt?.hash}`))
	}

	if (/^(deposit|buy)(\s+\d+(?:\.\d+)?)?$/i.test(body)) {
		const addr = getUserAddressFromPhone(from)
		const amt = (body.split(/\s+/)[1]) || '50'
		const link = buildOnrampLink({ provider: process.env.ONRAMP_PROVIDER!, address: addr, amount: amt })
		return res.json(
			replyText(
				`Buy USDC on Base and deliver to your address:\n${link}\nYou can also send USDC directly to your address.`
			)
		)
	}

	return res.json(replyText('Try: address | balance | deposit | send 5 USDC to 0x...'))
})

app.listen(3000, () => console.log('Bot listening on :3000'))

// Helpers (provider-specific parsers and responders)
function parseIncomingMessage(req: any) { /* ... */ return { from: '+15551234567', body: 'balance' } }
function replyText(text: string) { /* ... */ return { ok: true } }
function buildOnrampLink({ provider, address, amount }: { provider: string, address: string, amount: string }) {
	if (provider === 'moonpay') return `https://buy.moonpay.com?apiKey=KEY&currencyCode=usdc&walletAddress=${address}&baseCurrencyCode=usd&baseCurrencyAmount=${amount}&chain=base`
	if (provider === 'transak') return `https://global.transak.com/?apiKey=KEY&cryptoCurrency=USDC&network=base&walletAddress=${address}&disableWalletAddressForm=true`
	if (provider === 'coinbase') return `https://onramp.coinbase.com?address=${address}&asset=USDC&network=base&appId=APP_ID`
	return `https://example.com/onramp?address=${address}&amount=${amount}`
}
```

Notes:
- Use proper verification for Twilio/Meta signatures before trusting inbound messages.
- Do not store mnemonics/plain keys in the code. Use a KMS/HSM or secrets manager.
- Add rate limiting and per-user daily limits to reduce abuse risk.


## Webhooks and deployment

- Expose HTTPS with a trusted certificate. For local dev, use a tunnel like ngrok, then set the WhatsApp webhook URL to the tunnel.
- Ensure idempotency: dedupe messages and handle provider retries.
- Log transaction hashes and message IDs for auditing.


## Security, compliance, and risk

- Keys: Use HSM/KMS (e.g., AWS KMS) or a custodial wallet provider. Never echo secrets in logs.
- Compliance: Onramp providers typically require KYC/AML. Make your Terms and Privacy Policy visible.
- Limits: Per-user velocity limits, geo/IP screening if needed.
- Privacy: Phone numbers are PII; encrypt at rest and control access.


## Troubleshooting

- “Insufficient funds for gas”: fund the signing wallet with a small amount of Base ETH.
- “USDC transfer failed”: verify USDC contract address and decimals, and that the user has sufficient balance.
- “Webhook not firing”: check WhatsApp provider console logs and your HTTPS public URL.
- “Onramp link not prefilled”: provider parameters differ; double-check docs and required allowlists/app IDs.
- “Mobile money collect failed”: verify phone format, sufficient wallet balance, correct shortcode, and callback URL whitelisting.
- “Payout rejected”: check KYC tier limits, daily caps, AML flags, and correct country/currency settings.


## References

- Base network: https://base.org
- BaseScan (explorer): https://basescan.org
- USDC on Base (contract): 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- Twilio WhatsApp: https://www.twilio.com/whatsapp
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/
- ethers v6: https://docs.ethers.org
- Coinbase Onramp: https://docs.cloud.coinbase.com
- MoonPay: https://www.moonpay.com/
- Transak: https://transak.com/
- Stripe Onramp: https://stripe.com/docs/crypto/onramp
