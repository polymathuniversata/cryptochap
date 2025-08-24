# Enhanced Webhook Testing Script
# This script provides a more comprehensive testing of the WhatsApp webhook

# Get the ngrok public URL from the running ngrok process
$ngrokUrl = (curl -s http://localhost:4040/api/tunnels | Select-String -Pattern '"public_url":"https:.*?"' -AllMatches | ForEach-Object { $_.Matches.Value.Replace('"public_url":"', '').Replace('"', '') })

# Determine the webhook URL
$webhookUrl = ""
if ($ngrokUrl) {
    Write-Host "Found ngrok URL: $ngrokUrl" -ForegroundColor Green
    $webhookUrl = "$ngrokUrl/api/whatsapp/webhook"
} else {
    # Check if a local server is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $webhookUrl = "http://localhost:3000/api/whatsapp/webhook"
            Write-Host "Using local development server" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Local server not detected" -ForegroundColor Yellow
    }
    
    # If no URL determined, ask the user
    if (-not $webhookUrl) {
        $webhookUrl = Read-Host "Enter webhook URL (e.g. http://localhost:3000/api/whatsapp/webhook)"
    }
}

Write-Host "Testing webhook at: $webhookUrl" -ForegroundColor Cyan

# Check if a test was specified as a parameter
$testToRun = $null
if ($args.Count -gt 0) {
    $testToRun = $args[0]
}

# Run the enhanced webhook test script
node "./scripts/webhook-test-enhanced.js" $webhookUrl $testToRun
