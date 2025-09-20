@echo off
REM CryptoChap Deployment Script for Windows
REM This script helps deploy the CryptoChap application using Docker

echo 🚀 Starting CryptoChap deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from backend\.env.example...
    if exist "backend\.env.example" (
        copy backend\.env.example .env
        echo [WARNING] Please edit .env file with your actual configuration values before proceeding.
        pause
        exit /b 1
    ) else (
        echo [ERROR] .env.example file not found in backend\. Please create environment configuration.
        pause
        exit /b 1
    )
)

REM Build and start services
echo [INFO] Building and starting services...
docker-compose up --build -d

REM Wait for services to be healthy
echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...

REM Check PostgreSQL
docker ps | findstr cryptochap-postgres >nul
if %errorlevel% equ 0 (
    echo [INFO] PostgreSQL is running
) else (
    echo [ERROR] PostgreSQL failed to start
    pause
    exit /b 1
)

REM Check Backend
docker ps | findstr cryptochap-backend >nul
if %errorlevel% equ 0 (
    echo [INFO] Backend API is running
) else (
    echo [ERROR] Backend API failed to start
    pause
    exit /b 1
)

REM Check Frontend
docker ps | findstr cryptochap-frontend >nul
if %errorlevel% equ 0 (
    echo [INFO] Frontend is running
) else (
    echo [ERROR] Frontend failed to start
    pause
    exit /b 1
)

echo [INFO] 🎉 Deployment completed successfully!
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend API: http://localhost:3001
echo [INFO] PostgreSQL: localhost:5432
echo.
echo [INFO] To view logs: docker-compose logs -f
echo [INFO] To stop services: docker-compose down
echo.
pause