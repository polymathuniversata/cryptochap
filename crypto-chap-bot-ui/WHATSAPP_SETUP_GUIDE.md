# WhatsApp Business API Setup Steps

Follow these steps to register your webhook with WhatsApp:

## 1. Configure Meta WhatsApp Business API

1. Go to [Meta Developers Console](https://developers.facebook.com/apps/)
2. Open your CryptoChap Bot app
3. Go to WhatsApp > Configuration
4. Under "Webhook" section, click "Edit"
5. Set your callback URL:
   ```
   https://your-ngrok-url.ngrok-free.app/api/whatsapp/webhook
   ```
6. Set Verify Token:
   ```
   cryptochap_webhook_verify_123
   ```
   (This must match META_VERIFY_TOKEN in your .env.local)
7. Subscribe to webhook events:
   - `messages`
   - `message_deliveries`

## 2. Test Webhook Verification

To test if your webhook is configured correctly, visit:

```
https://your-ngrok-url.ngrok-free.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=cryptochap_webhook_verify_123
```

You should see "test" displayed on the page.

## 3. Add Test Phone Number

1. In WhatsApp Business API setup, go to "Configuration" > "Phone Numbers"
2. Click on your phone number
3. Go to "Messaging" tab
4. Under "Message Templates", check if you have any approved templates
5. Under "Quality" tab, make sure your messaging limit is set
6. In "Test Numbers" section, add your personal phone number for testing

## 4. Test Your Bot

1. From your personal WhatsApp, message your WhatsApp Business number
2. Try sending one of these commands:
   - `balance`
   - `help`
   - `menu`
3. You should receive a response from your bot

## 5. What to Do If It's Not Working

### If verification fails:
- Check your META_VERIFY_TOKEN in .env.local matches what you entered in Meta dashboard
- Ensure your webhook URL is correct and accessible
- Check logs for errors

### If messages aren't being received:
- Verify you've subscribed to the "messages" webhook event
- Check your WhatsApp Business API access token is valid
- Restart your development server
- Check server logs for incoming requests

### If responses aren't being sent:
- Check your META_WHATSAPP_TOKEN is valid
- Verify your META_PHONE_NUMBER_ID is correct
- Look at your server logs for any API errors

Remember: WhatsApp Business API has rate limits, so you may need to wait between tests.

## 6. Moving to Production

When you're ready to deploy to production:

1. Update your `.env.local` with your production URL
2. Update your webhook URL in Meta Developer Console
3. Deploy your application
4. Test again with real phone numbers
