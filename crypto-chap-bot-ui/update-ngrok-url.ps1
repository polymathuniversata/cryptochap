# Run this script to automatically update your .env.local with the ngrok URL

# Get the ngrok public URL from the running ngrok process
$ngrokUrl = (curl -s http://localhost:4040/api/tunnels | Select-String -Pattern '"public_url":"https:.*?"' -AllMatches | ForEach-Object { $_.Matches.Value.Replace('"public_url":"', '').Replace('"', '') })

if (-not $ngrokUrl) {
    Write-Host "Error: Could not find ngrok URL. Make sure ngrok is running." -ForegroundColor Red
    exit 1
}

Write-Host "Found ngrok URL: $ngrokUrl" -ForegroundColor Green

# Read the current .env.local file
$envPath = ".env.local"
$envContent = Get-Content $envPath -Raw

# Update the URLs
$updatedContent = $envContent -replace "NEXT_PUBLIC_APP_URL=.*", "NEXT_PUBLIC_APP_URL=$ngrokUrl # Your application domain (automatically updated by script)"
$updatedContent = $updatedContent -replace "WEBHOOK_BASE_URL=.*", "WEBHOOK_BASE_URL=$ngrokUrl # Base URL for webhooks (automatically updated by script)"

# Write the updated content back to the file
$updatedContent | Out-File $envPath -NoNewline

Write-Host "Updated .env.local with ngrok URL" -ForegroundColor Green
Write-Host "NEXT_PUBLIC_APP_URL=$ngrokUrl" -ForegroundColor Cyan
Write-Host "WEBHOOK_BASE_URL=$ngrokUrl" -ForegroundColor Cyan

Write-Host "`nDo you want to restart the development server? (y/n)" -ForegroundColor Yellow
$restart = Read-Host

if ($restart -eq "y") {
    Write-Host "Stopping existing Next.js process..." -ForegroundColor Yellow
    Stop-Process -Name "node" -ErrorAction SilentlyContinue
    
    Write-Host "Starting development server..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
    
    Write-Host "Development server restarted with updated environment variables." -ForegroundColor Green
}
