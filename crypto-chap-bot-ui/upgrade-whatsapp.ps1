# CryptoChap WhatsApp Implementation Upgrade Script
# This script will update the project to use the new WhatsApp implementation

# Function to check if the file exists
function Test-FileExistsAndBackup($filePath) {
    if (Test-Path $filePath) {
        $backupPath = "$filePath.backup"
        Write-Host "Creating backup of $filePath" -ForegroundColor Cyan
        Copy-Item $filePath $backupPath -Force
        return $true
    } else {
        Write-Host "Warning: $filePath does not exist" -ForegroundColor Yellow
        return $false
    }
}

# Create necessary directories if they don't exist
$servicesDir = "./lib/services"
if (-not (Test-Path $servicesDir)) {
    Write-Host "Creating services directory" -ForegroundColor Green
    New-Item -ItemType Directory -Path $servicesDir -Force | Out-Null
}

$typesDir = "./lib/types"
if (-not (Test-Path $typesDir)) {
    Write-Host "Creating types directory" -ForegroundColor Green
    New-Item -ItemType Directory -Path $typesDir -Force | Out-Null
}

# Backup existing files
Test-FileExistsAndBackup "./app/api/whatsapp/webhook/route.ts"

# Install dotenv package
Write-Host "Installing dotenv package" -ForegroundColor Green
npm install dotenv --save

# Copy new implementation files
Write-Host "Updating implementation files" -ForegroundColor Green

# 1. Rename the new route file
if (Test-Path "./app/api/whatsapp/webhook/route.new.ts") {
    Move-Item -Path "./app/api/whatsapp/webhook/route.new.ts" -Destination "./app/api/whatsapp/webhook/route.ts" -Force
}

Write-Host "`n===== Upgrade Complete =====`n" -ForegroundColor Green

Write-Host "New files and services added:"
Write-Host "  • WhatsApp Service" -ForegroundColor Cyan
Write-Host "  • Token Management Service" -ForegroundColor Cyan
Write-Host "  • Logging Service" -ForegroundColor Cyan
Write-Host "  • Enhanced webhook testing" -ForegroundColor Cyan
Write-Host "  • Token management tools" -ForegroundColor Cyan

Write-Host "`nAvailable tools:"
Write-Host "  • ./manage-whatsapp.ps1" -ForegroundColor Magenta
Write-Host "    - Manage WhatsApp tokens"
Write-Host "    - Test token validity"
Write-Host "    - Update tokens"
Write-Host "  • ./test-webhook-enhanced.ps1" -ForegroundColor Magenta
Write-Host "    - Test different message types"
Write-Host "    - Comprehensive webhook testing"

Write-Host "`nWould you like to check your WhatsApp token now? (y/n)" -ForegroundColor Yellow
$response = Read-Host
if ($response.ToLower() -eq 'y') {
    ./manage-whatsapp.ps1
}

Write-Host "`nSetup complete! Your WhatsApp integration is now more robust and maintainable." -ForegroundColor Green
