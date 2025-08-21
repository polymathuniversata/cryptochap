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


## 📝 Environment Variables

Create a `.env` file with the following configuration:

```env
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

---

<div align="center">

**Built for the future of accessible crypto** 🌍

*Made with ❤️ for global financial inclusion*

</div>
