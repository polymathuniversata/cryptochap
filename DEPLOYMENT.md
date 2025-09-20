# CryptoChap - Deployment Guide

This guide covers how to deploy the CryptoChap application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cryptochap
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration values. See [Environment Variables](#environment-variables) section below.

### 3. Deploy with Docker

**Linux/Mac:**
```bash
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

Or manually:
```bash
docker-compose up --build -d
```

### 4. Verify Deployment

Once deployed, verify the services are running:

```bash
docker-compose ps
```

You should see all services in "Up" status:
- `cryptochap-postgres` (Database)
- `cryptochap-redis` (Cache)
- `cryptochap-backend` (API Server)
- `cryptochap-frontend` (Web App)
- `cryptochap-nginx` (Reverse Proxy)

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## Environment Variables

### Required Variables

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cryptochap
DB_USER=cryptochap
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Blockchain Configuration
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_contract_address

# Redis Configuration (Optional)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Application Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### Optional Variables

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# SSL Configuration (for production)
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │
│   (Port 80/443) │◄──►│   Next.js       │
└─────────────────┘    │   (Port 3000)   │
                       └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐
│   Backend API   │    │   PostgreSQL    │
│   Express.js    │◄──►│   Database      │
│   (Port 3001)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   Cache/Session │
                       │   (Port 6379)   │
                       └─────────────────┘
```

## Database Setup

The database is automatically initialized with the schema from `schema.sql` when the PostgreSQL container starts for the first time.

### Manual Database Access

```bash
# Access PostgreSQL container
docker-compose exec postgres psql -U cryptochap -d cryptochap

# Or from host
psql -h localhost -p 5432 -U cryptochap -d cryptochap
```

## Logs and Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Check specific container health
docker-compose exec backend curl -f http://localhost:3001/health
```

## Development vs Production

### Development Mode

For development with hot reloading:

```bash
# Start only database and redis
docker-compose up postgres redis -d

# Start backend in development mode
cd backend && npm run dev

# Start frontend in development mode
cd frontend && npm run dev
```

### Production Mode

The Docker setup is optimized for production with:
- Multi-stage builds for smaller images
- Non-root users for security
- Health checks and restart policies
- Nginx reverse proxy for static file serving

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3000
   # Or on Windows
   netstat -ano | findstr :3000

   # Stop conflicting service or change ports in docker-compose.yml
   ```

2. **Database connection failed**
   ```bash
   # Check database logs
   docker-compose logs postgres

   # Reset database
   docker-compose down -v
   docker-compose up postgres -d
   ```

3. **Build failures**
   ```bash
   # Clear Docker cache
   docker system prune -f

   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Memory issues**
   ```bash
   # Increase Docker memory limit in Docker Desktop settings
   # Or add swap space on Linux
   ```

### Reset Everything

To completely reset the deployment:

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up unused resources
docker system prune -f
```

## Security Considerations

### Production Deployment

1. **Change default passwords** in `.env`
2. **Use strong secrets** for JWT and database
3. **Enable SSL/TLS** with proper certificates
4. **Configure firewall** to restrict access
5. **Regular updates** of Docker images
6. **Monitor logs** for security events

### Environment Isolation

- Use separate `.env` files for different environments
- Never commit secrets to version control
- Use Docker secrets for sensitive data in production

## Performance Optimization

### Resource Allocation

Adjust resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Database Optimization

- Monitor slow queries with PostgreSQL logs
- Add indexes for frequently queried columns
- Configure connection pooling if needed

### Caching Strategy

Redis is included for:
- Session storage
- API response caching
- Rate limiting data

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U cryptochap cryptochap > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U cryptochap -d cryptochap < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v cryptochap_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Support

For issues and questions:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all prerequisites are met
4. Check Docker and Docker Compose versions

## Contributing

When making changes to the deployment:
1. Update this README if needed
2. Test deployment on clean environment
3. Update Docker images versions regularly
4. Document any new environment variables