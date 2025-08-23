# WhatsApp Business API Integration Setup

## Overview
This guide will help you set up Meta's WhatsApp Business API with your CryptoChap application for real WhatsApp messaging integration.

## Prerequisites

1. **Meta Developer Account** - [developers.facebook.com](https://developers.facebook.com)
2. **WhatsApp Business Account** - [business.whatsapp.com](https://business.whatsapp.com)
3. **Phone Number** - For WhatsApp Business verification
4. **SSL Certificate** - Required for webhook endpoints (use ngrok for testing)

## Step 1: Create Meta App

1. Go to [Meta Developers Console](https://developers.facebook.com/apps/)
2. Click "Create App" → Select "Business" → Continue
3. Fill app details:
   - **App Name**: `CryptoChap Bot`
   - **Contact Email**: Your email
   - **Business Manager**: Select or create one

## Step 2: Add WhatsApp Product

1. In your app dashboard, click "Add Products"
2. Find "WhatsApp" and click "Set up"
3. Configure WhatsApp Business API:
   - Select your Business Manager
   - Create new WhatsApp Business Account or use existing

## Step 3: Get API Credentials

From your WhatsApp Business API settings, collect:

```bash
# Required environment variables
META_WHATSAPP_TOKEN=EAAG... # From "Temporary access token"
META_VERIFY_TOKEN=your_custom_verify_token # Create your own
META_PHONE_NUMBER_ID=1xxxxxxxxxxxxxxx # From "Phone Number ID"
META_APP_ID=xxxxxxxxxxxxxxx # From App Settings > Basic
META_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # From App Settings > Basic
```

## Step 4: Configure Webhooks

1. In WhatsApp Business API settings, go to "Webhooks"
2. Configure webhook URL:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```
3. Set Verify Token: Use your custom `META_VERIFY_TOKEN`
4. Subscribe to webhook fields:
   - `messages` ✓
   - `message_deliveries` ✓
   - `message_reactions` ✓
   - `message_echoes` ✓

## Step 5: Environment Configuration

1. Copy `.env.local.example` to `.env.local`
2. Fill in your WhatsApp credentials:

```bash
# WhatsApp Business API
META_WHATSAPP_TOKEN=EAAGt... # Your temporary access token
META_VERIFY_TOKEN=your_unique_verify_token_123
META_PHONE_NUMBER_ID=109876543210987654
META_APP_ID=123456789012345
META_APP_SECRET=abcdef1234567890abcdef1234567890

# Blockchain (Base Network)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-alchemy-key
OPERATOR_PRIVATE_KEY=0x1234567890abcdef... # Bot wallet private key

# Your domain
NEXT_PUBLIC_APP_URL=https://your-domain.com
WEBHOOK_BASE_URL=https://your-domain.com
```

## Step 6: Install Dependencies

```bash
npm install
# or
npm install ethers
```

## Step 7: Test Webhook Connection

### Using ngrok (for development):

1. Install ngrok: `npm install -g ngrok`
2. Start your development server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok HTTPS URL in your webhook configuration

### Verify webhook:
```bash
curl -X GET "https://your-ngrok-url.ngrok.io/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_verify_token"
```

Should return: `test`

## Step 8: Send Test Message

1. Add your phone number to WhatsApp Business API testing
2. Send a message from your WhatsApp to the business number
3. Check server logs for processing confirmation

## Step 9: Deploy to Production

### Using Vercel:

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel`
3. Add environment variables in Vercel dashboard
4. Update webhook URL to production domain

### Using other platforms:
- Update `WEBHOOK_BASE_URL` to your production domain
- Ensure SSL certificate is valid
- Set all environment variables

## Available Commands

Once setup is complete, users can interact with your WhatsApp bot using:

| Command | Description |
|---------|-------------|
| `balance` | Check USDC and ETH balance |
| `address` | Get Base network deposit address |
| `buy 50` | Purchase USDC with fiat |
| `send 10 USDC to 0x...` | Transfer to address |
| `send 5 USDC to +1234567890` | Send to phone number |
| `history` | View transaction history |
| `menu` or `help` | Show interactive menu |

## Interactive Features

The bot supports:
- ✅ Interactive buttons for common actions
- ✅ List menus for purchase amounts
- ✅ Transaction confirmations
- ✅ Rich crypto transaction displays
- ✅ Real-time balance checking
- ✅ BaseScan transaction links

## Security Considerations

1. **Webhook Verification**: All webhooks are cryptographically verified
2. **Environment Variables**: Never commit secrets to version control
3. **Rate Limiting**: Implement rate limits for production
4. **User Validation**: Validate all user inputs
5. **Key Management**: Use secure key management for production

## Troubleshooting

### Common Issues:

1. **Webhook verification failed**
   - Check `META_APP_SECRET` is correct
   - Ensure webhook URL is HTTPS
   - Verify signature implementation

2. **Messages not sending**
   - Check `META_WHATSAPP_TOKEN` is valid
   - Verify `META_PHONE_NUMBER_ID` is correct
   - Check API rate limits

3. **Blockchain transactions failing**
   - Ensure `OPERATOR_PRIVATE_KEY` has ETH for gas
   - Verify `BASE_RPC_URL` is accessible
   - Check network connectivity

4. **Template messages not working**
   - Ensure templates are approved in WhatsApp Manager
   - Check template parameter formatting
   - Verify language codes

### Debug Mode:

Add to your `.env.local`:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## Production Checklist

- [ ] SSL certificate configured
- [ ] Environment variables set
- [ ] Webhook URL updated
- [ ] Test all commands
- [ ] Rate limiting implemented
- [ ] Error monitoring setup
- [ ] Backup and recovery plan
- [ ] Template messages approved

## Support

For additional help:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

---

**🔒 Security Note**: Keep your private keys and API tokens secure. Never share them publicly or commit them to version control.