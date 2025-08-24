# WhatsApp Token Management Script
# This script provides an easy way to manage WhatsApp tokens

# Check if ts-node is installed, install it if needed
$tsNodeInstalled = npm list -g ts-node | Select-String "ts-node"
if (-not $tsNodeInstalled) {
    Write-Host "Installing ts-node globally for script execution..." -ForegroundColor Yellow
    npm install -g ts-node typescript
}

# Function to get ngrok URL if running
function Get-NgrokUrl {
    try {
        $ngrokUrl = (curl -s http://localhost:4040/api/tunnels | Select-String -Pattern '"public_url":"https:.*?"' -AllMatches | ForEach-Object { $_.Matches.Value.Replace('"public_url":"', '').Replace('"', '') })
        return $ngrokUrl
    } catch {
        return $null
    }
}

# Check if ngrok is running and update .env.local
$ngrokUrl = Get-NgrokUrl
if ($ngrokUrl) {
    Write-Host "Found ngrok URL: $ngrokUrl" -ForegroundColor Green
    
    # Update .env.local with ngrok URL if desired
    $updateEnv = Read-Host "Do you want to update .env.local with the ngrok URL? (y/n)"
    if ($updateEnv -eq "y") {
        Write-Host "Updating .env.local with ngrok URL..." -ForegroundColor Yellow
        
        # Read the current .env.local file
        $envPath = ".env.local"
        if (Test-Path $envPath) {
            $envContent = Get-Content $envPath -Raw
            
            # Update the URLs
            $updatedContent = $envContent -replace "NEXT_PUBLIC_APP_URL=.*", "NEXT_PUBLIC_APP_URL=$ngrokUrl # Your application domain"
            $updatedContent = $updatedContent -replace "WEBHOOK_BASE_URL=.*", "WEBHOOK_BASE_URL=$ngrokUrl # Base URL for webhooks"
            
            # Write the updated content back to the file
            $updatedContent | Out-File $envPath -NoNewline
            
            Write-Host "Updated .env.local with ngrok URL" -ForegroundColor Green
        } else {
            Write-Host ".env.local file not found" -ForegroundColor Red
        }
    }
}

# Compile and run the token management script
Write-Host "Running WhatsApp token management script..." -ForegroundColor Cyan
ts-node ./scripts/manage-tokens.ts
