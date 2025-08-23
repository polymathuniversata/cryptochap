# WhatsApp Setup Instructions

This document provides instructions for setting up and testing your WhatsApp integration with CryptoChap.

## Initial Setup

1. Make sure you have the following files configured:
   - `.env.local` - Contains all your environment variables
   - `app/api/whatsapp/webhook/route.ts` - Handles WhatsApp webhook events

2. Run the development server:
   ```bash
   npm run dev
   ```

3. In a separate terminal, start ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

4. Update your `.env.local` with the ngrok URL (automated):
   ```bash
   # Run our automated script to update environment variables
   ./update-ngrok-url.ps1
   ```
   
   Or manually update:
   ```
   NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app
   WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok-free.app
   ```

5. Follow the detailed setup instructions in `WHATSAPP_SETUP_GUIDE.md`

## Testing Your Webhook

To test if your webhook is correctly receiving and processing messages:

1. Run the test script:
   ```bash
   # Automated testing with your ngrok URL
   ./test-webhook.ps1
   
   # Or manually with a specific URL
   node scripts/webhook-test.js https://your-ngrok-url.ngrok-free.app/api/whatsapp/webhook
   ```

2. Check your server logs for processing information

3. Verify the webhook URL directly:
   ```
   https://your-ngrok-url.ngrok-free.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=cryptochap_webhook_verify_123
   ```

## Available Commands

Users can interact with your bot using:

- `balance` - Check USDC and ETH balances
- `address` - Get Base network wallet address
- `buy 50` - Purchase USDC with specified amount
- `send 10 USDC to 0x...` - Transfer to a wallet address
- `send 5 USDC to +1234567890` - Send to a phone number
- `help` or `menu` - Show interactive menu

## Production Deployment

When ready for production:

1. Deploy your Next.js app to a platform like Vercel or Netlify
2. Update your webhook URL in the Meta Developer Console
3. Set all environment variables in your production environment
4. Test with real phone numbers

For more detailed instructions, see `WHATSAPP_SETUP_GUIDE.md`.
