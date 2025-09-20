# CryptoChap Deployment Guide

## Overview
This guide covers the deployment process for CryptoChap across different environments.

## Prerequisites

### System Requirements
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose
- AWS CLI (for cloud deployment)

### Environment Variables
Create `.env` files for each environment:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cryptochap

# Redis
REDIS_URL=redis://localhost:6379

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Blockchain
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
OPERATOR_PRIVATE_KEY=your_private_key
USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

## Local Development

### Using Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cryptochap
      POSTGRES_USER: cryptochap
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Running Locally
```bash
# Start dependencies
docker-compose up -d

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Run database migrations
cd backend && npm run migrate

# Start services
cd backend && npm run dev
cd frontend && npm run dev
```

## Staging Deployment

### Infrastructure Setup
```terraform
# infrastructure/staging/main.tf
resource "aws_vpc" "staging" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "cryptochap-staging"
    Environment = "staging"
  }
}

resource "aws_ecs_cluster" "staging" {
  name = "cryptochap-staging"
}

resource "aws_rds_instance" "staging" {
  allocated_storage    = 20
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.micro"
  db_name             = "cryptochap"
  username            = var.db_username
  password            = var.db_password
  skip_final_snapshot = true
}
```

### Deployment Script
```bash
#!/bin/bash
# deploy-staging.sh

# Build and push Docker images
docker build -t cryptochap/frontend:staging ./frontend
docker build -t cryptochap/backend:staging ./backend

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker push cryptochap/frontend:staging
docker push cryptochap/backend:staging

# Deploy to ECS
aws ecs update-service \
  --cluster cryptochap-staging \
  --service cryptochap-frontend \
  --force-new-deployment

aws ecs update-service \
  --cluster cryptochap-staging \
  --service cryptochap-backend \
  --force-new-deployment
```

## Production Deployment

### Infrastructure as Code
```terraform
# infrastructure/production/main.tf
resource "aws_vpc" "production" {
  cidr_block = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "cryptochap-production"
    Environment = "production"
  }
}

resource "aws_rds_instance" "production" {
  allocated_storage    = 100
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  db_name             = "cryptochap"
  username            = var.db_username
  password            = var.db_password
  multi_az            = true
  backup_retention_period = 30
  skip_final_snapshot = false
  final_snapshot_identifier = "cryptochap-production-final"
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id      = "cryptochap-redis"
  engine          = "redis"
  node_type       = "cache.t3.micro"
  num_cache_nodes = 2
  port            = 6379
}

resource "aws_ecs_cluster" "production" {
  name = "cryptochap-production"
}

resource "aws_ecs_service" "frontend" {
  name            = "cryptochap-frontend"
  cluster         = aws_ecs_cluster.production.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }
}

resource "aws_ecs_service" "backend" {
  name            = "cryptochap-backend"
  cluster         = aws_ecs_cluster.production.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3001
  }
}
```

### Docker Configuration
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY src/ ./src/

EXPOSE 3001
CMD ["npm", "start"]
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker images
        run: |
          docker build -t cryptochap-frontend ./frontend
          docker build -t cryptochap-backend ./backend
          docker tag cryptochap-frontend:latest ${{ secrets.ECR_URI }}/cryptochap-frontend:latest
          docker tag cryptochap-backend:latest ${{ secrets.ECR_URI }}/cryptochap-backend:latest
          docker push ${{ secrets.ECR_URI }}/cryptochap-frontend:latest
          docker push ${{ secrets.ECR_URI }}/cryptochap-backend:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster cryptochap-production \
            --service cryptochap-frontend \
            --force-new-deployment

          aws ecs update-service \
            --cluster cryptochap-production \
            --service cryptochap-backend \
            --force-new-deployment
```

## Monitoring & Observability

### Application Monitoring
```typescript
// backend/src/utils/monitoring.ts
import { logger } from './logger';

export class MonitoringService {
  static recordMetric(name: string, value: number, tags?: Record<string, string>) {
    // Send metrics to monitoring service
    logger.info(`Metric: ${name}`, { value, tags });
  }

  static recordError(error: Error, context?: any) {
    logger.error('Application error', {
      error: error.message,
      stack: error.stack,
      context
    });
  }

  static recordRequest(method: string, url: string, duration: number, status: number) {
    this.recordMetric('http_request_duration', duration, {
      method,
      url,
      status: status.toString()
    });
  }
}
```

### Health Checks
```typescript
// backend/src/controllers/health.ts
import { Request, Response } from 'express';
import { MonitoringService } from '../utils/monitoring';

export const healthCheck = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Check database connection
    await checkDatabaseConnection();

    // Check Redis connection
    await checkRedisConnection();

    // Check external services
    await checkWhatsAppConnection();

    const responseTime = Date.now() - startTime;

    MonitoringService.recordMetric('health_check_success', 1);
    MonitoringService.recordMetric('health_check_response_time', responseTime);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: 'healthy',
        redis: 'healthy',
        whatsapp: 'healthy'
      }
    });
  } catch (error) {
    MonitoringService.recordError(error as Error);
    MonitoringService.recordMetric('health_check_failure', 1);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
};
```

## Rollback Strategy

### Automated Rollback
```bash
#!/bin/bash
# rollback.sh

# Get previous deployment
PREVIOUS_TASK=$(aws ecs describe-services \
  --cluster cryptochap-production \
  --services cryptochap-backend \
  --query 'services[0].taskDefinition' \
  --output text)

# Rollback to previous version
aws ecs update-service \
  --cluster cryptochap-production \
  --service cryptochap-backend \
  --task-definition $PREVIOUS_TASK \
  --force-new-deployment
```

### Manual Rollback Steps
1. Identify the issue causing the deployment failure
2. Stop the failing deployment
3. Scale down the failing service to 0 instances
4. Scale up the previous working version
5. Monitor system health
6. Investigate root cause
7. Fix the issue and redeploy

## Security Considerations

### Secrets Management
```yaml
# Use AWS Secrets Manager or similar
secrets:
  database_password:
    secretId: "cryptochap/database"
    field: "password"
  whatsapp_token:
    secretId: "cryptochap/whatsapp"
    field: "access_token"
```

### Network Security
- Use VPC for resource isolation
- Security groups for access control
- WAF for application protection
- SSL/TLS for all communications

### Compliance
- GDPR compliance for EU users
- KYC/AML requirements
- Data encryption at rest and in transit
- Regular security audits

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_users_phone ON users(phone);

-- Partition large tables
CREATE TABLE transactions_y2024m01 PARTITION OF transactions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
export class CacheService {
  static async getWalletBalance(address: string): Promise<Balance | null> {
    const cacheKey = `wallet:${address}:balance`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const balance = await database.getWalletBalance(address);

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(balance));

    return balance;
  }
}
```

This deployment guide provides a comprehensive approach to deploying CryptoChap across different environments with proper monitoring, security, and rollback strategies.