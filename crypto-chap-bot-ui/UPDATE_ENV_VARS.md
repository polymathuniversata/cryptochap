# Update Environment Variables with ngrok URL

## Automatic Method (Recommended)

Run our automated script that will find your ngrok URL and update your environment variables:

```powershell
./update-ngrok-url.ps1
```

This script will:
1. Find the active ngrok URL
2. Update your `.env.local` file automatically
3. Offer to restart your development server

## Manual Method

If you prefer to update manually:

1. Find your ngrok URL in the ngrok terminal window (looks like `https://abcd-123-456-789.ngrok-free.app`)
2. Open `.env.local`
3. Update these two variables:
   ```
   NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app
   WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok-free.app
   ```
4. Save the file
5. Restart your Next.js development server

## Testing Your Webhook

After updating your environment variables, test your webhook with:

```powershell
./test-webhook.ps1
```

This will automatically detect your ngrok URL and send a test message to your webhook endpoint.

This setup will allow WhatsApp's servers to reach your local development environment.
