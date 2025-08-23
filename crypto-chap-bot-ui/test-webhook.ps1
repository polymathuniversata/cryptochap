# Run this script to test your WhatsApp webhook using the ngrok URL
# Make sure ngrok is running first

# Get the ngrok public URL from the running ngrok process
$ngrokUrl = (curl -s http://localhost:4040/api/tunnels | Select-String -Pattern '"public_url":"https:.*?"' -AllMatches | ForEach-Object { $_.Matches.Value.Replace('"public_url":"', '').Replace('"', '') })

if (-not $ngrokUrl) {
    Write-Host "Error: Could not find ngrok URL. Make sure ngrok is running." -ForegroundColor Red
    exit 1
}

$webhookUrl = "$ngrokUrl/api/whatsapp/webhook"

Write-Host "Found ngrok URL: $ngrokUrl" -ForegroundColor Green
Write-Host "Testing webhook at: $webhookUrl" -ForegroundColor Cyan

# Run the webhook test script with the URL
node "./scripts/webhook-test.js" $webhookUrl
