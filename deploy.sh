#!/bin/bash

# CryptoChap Deployment Script
# This script helps deploy the CryptoChap application using Docker

set -e

echo "🚀 Starting CryptoChap deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from backend/.env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example .env
        print_warning "Please edit .env file with your actual configuration values before proceeding."
        exit 1
    else
        print_error ".env.example file not found in backend/. Please create environment configuration."
        exit 1
    fi
fi

# Build and start services
print_status "Building and starting services..."
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker ps | grep -q cryptochap-postgres; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL failed to start"
    exit 1
fi

# Check Backend
if docker ps | grep -q cryptochap-backend; then
    print_status "Backend API is running"
else
    print_error "Backend API failed to start"
    exit 1
fi

# Check Frontend
if docker ps | grep -q cryptochap-frontend; then
    print_status "Frontend is running"
else
    print_error "Frontend failed to start"
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
print_status "Frontend: http://localhost:3000"
print_status "Backend API: http://localhost:3001"
print_status "PostgreSQL: localhost:5432"

# Show logs command
print_status "To view logs: docker-compose logs -f"
print_status "To stop services: docker-compose down"