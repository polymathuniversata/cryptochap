# CryptoChap API Documentation

## Overview

This document provides comprehensive documentation for all CryptoChap API endpoints, including request/response formats, authentication requirements, and error handling.

## Base URL

```
Production: https://api.cryptochap.dev
Development: http://localhost:3001/api
```

## Authentication

Currently, CryptoChap uses phone number-based authentication through WhatsApp. API endpoints are secured through:
- Rate limiting (100 requests/15min global, 10/minute for sensitive endpoints)
- Input validation and sanitization
- Request ID tracking for security monitoring

## 📡 System Endpoints

### Health Check
**GET** `/health`

Basic system health check.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "environment": "production",
  "version": "1.0.0"
}
```

### Detailed Health Check
**GET** `/api/system/health`

Comprehensive health check with database and external service status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "poolSize": 10,
    "activeConnections": 3
  },
  "blockchain": {
    "network": "Base",
    "blockNumber": 12345678,
    "gasPrice": "20 gwei"
  },
  "whatsapp": {
    "status": "connected",
    "lastMessage": "2024-01-01T11:55:00.000Z"
  },
  "memory": {
    "used": "245MB",
    "total": "512MB",
    "percentage": 47.8
  }
}
```

### Performance Metrics
**GET** `/api/system/metrics`

System performance metrics and statistics.

**Response**:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "period": "5m",
  "requests": {
    "total": 15420,
    "successful": 15380,
    "failed": 40,
    "averageResponseTime": "145ms"
  },
  "database": {
    "queries": 12500,
    "averageQueryTime": "12ms",
    "activeConnections": 8
  },
  "blockchain": {
    "transactions": 245,
    "averageGasUsed": "45000",
    "failedTransactions": 2
  },
  "whatsapp": {
    "messagesProcessed": 890,
    "averageProcessingTime": "200ms",
    "errors": 5
  }
}
```

### API Documentation
**GET** `/api/docs`

Interactive API documentation overview.

**Response**: HTML documentation interface

### OpenAPI Specification
**GET** `/api/docs/openapi.json`

Complete OpenAPI 3.0 specification for all endpoints.

### Error Code Reference
**GET** `/api/docs/errors`

Comprehensive error code documentation.

## 👥 User Management

### Get User
**GET** `/api/users/{id}`

Retrieve user information by ID.

**Parameters**:
- `id` (string, required) - User ID (UUID format)

**Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "phoneNumber": "+1234567890",
  "displayName": "John Doe",
  "walletAddress": "0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z",
  "isActive": true,
  "preferences": {
    "language": "en",
    "notifications": true,
    "currency": "USD"
  }
}
```

### Update User
**PUT** `/api/users/{id}`

Update user information.

**Parameters**:
- `id` (string, required) - User ID

**Request Body**:
```json
{
  "displayName": "Jane Doe",
  "preferences": {
    "language": "es",
    "notifications": false,
    "currency": "EUR"
  }
}
```

**Response**: Updated user object

### Create User
**POST** `/api/users`

Create a new user (typically called from WhatsApp integration).

**Request Body**:
```json
{
  "phoneNumber": "+1234567890",
  "displayName": "John Doe",
  "metadata": {
    "source": "whatsapp",
    "verified": true
  }
}
```

**Response**: Created user object

### Delete User
**DELETE** `/api/users/{id}`

Soft delete a user (marks as inactive).

**Parameters**:
- `id` (string, required) - User ID

**Response**:
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 💰 Wallet Management

### Get Wallet
**GET** `/api/wallets/{id}`

Retrieve wallet information.

**Parameters**:
- `id` (string, required) - Wallet ID (UUID format)

**Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "456e7890-e89b-12d3-a456-426614174001",
  "address": "0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8",
  "balance": {
    "eth": "1.234567890123456789",
    "usdc": "1234.56"
  },
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T11:30:00.000Z",
  "isActive": true,
  "network": "base",
  "type": "custodial"
}
```

### Create Wallet
**POST** `/api/wallets`

Create a new wallet for a user.

**Request Body**:
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001",
  "walletType": "custodial", // or "non-custodial"
  "network": "base"
}
```

**Response**: Created wallet object

### Update Wallet Balance
**PUT** `/api/wallets/{id}/balance`

Update wallet balance (internal operation).

**Parameters**:
- `id` (string, required) - Wallet ID

**Request Body**:
```json
{
  "eth": "1.234567890123456789",
  "usdc": "1234.56",
  "lastUpdated": "2024-01-01T11:30:00.000Z"
}
```

**Response**: Updated wallet object

### Get User Wallets
**GET** `/api/users/{userId}/wallets`

Retrieve all wallets for a user.

**Parameters**:
- `userId` (string, required) - User ID

**Response**:
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001",
  "wallets": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "address": "0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8",
      "balance": { "eth": "1.23", "usdc": "1234.56" },
      "isActive": true
    }
  ],
  "totalBalance": {
    "eth": "1.23",
    "usdc": "1234.56"
  }
}
```

## 💸 Transaction Management

### Get Transaction
**GET** `/api/transactions/{id}`

Retrieve transaction details.

**Parameters**:
- `id` (string, required) - Transaction ID

**Response**:
```json
{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "userId": "456e7890-e89b-12d3-a456-426614174001",
  "walletId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "transfer",
  "status": "completed",
  "amount": "100.00",
  "token": "USDC",
  "fromAddress": "0x742d35Cc6aA2eA4c8c5D7f8E6E1F8c8F8d8E8e8e8",
  "toAddress": "0x1234567890123456789012345678901234567890",
  "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "gasUsed": "45000",
  "gasPrice": "20 gwei",
  "blockNumber": 12345678,
  "createdAt": "2024-01-01T11:00:00.000Z",
  "updatedAt": "2024-01-01T11:01:00.000Z",
  "metadata": {
    "source": "whatsapp",
    "command": "send 100 0x1234567890123456789012345678901234567890"
  }
}
```

### Create Transaction
**POST** `/api/transactions`

Create a new transaction.

**Request Body**:
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001",
  "walletId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "transfer",
  "amount": "100.00",
  "token": "USDC",
  "toAddress": "0x1234567890123456789012345678901234567890",
  "metadata": {
    "source": "whatsapp",
    "initiatedBy": "user"
  }
}
```

**Response**: Created transaction object

### Update Transaction Status
**PUT** `/api/transactions/{id}/status`

Update transaction status (internal operation).

**Parameters**:
- `id` (string, required) - Transaction ID

**Request Body**:
```json
{
  "status": "completed", // pending, processing, completed, failed
  "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "gasUsed": "45000",
  "gasPrice": "20 gwei",
  "blockNumber": 12345678
}
```

**Response**: Updated transaction object

### Get User Transaction History
**GET** `/api/users/{userId}/transactions`

Retrieve transaction history for a user.

**Parameters**:
- `userId` (string, required) - User ID

**Query Parameters**:
- `limit` (number, optional) - Number of transactions (default: 20)
- `offset` (number, optional) - Pagination offset (default: 0)
- `type` (string, optional) - Filter by type (transfer, receive)
- `status` (string, optional) - Filter by status (pending, completed, failed)

**Response**:
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001",
  "transactions": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "type": "transfer",
      "status": "completed",
      "amount": "100.00",
      "token": "USDC",
      "toAddress": "0x1234567890123456789012345678901234567890",
      "txHash": "0xabcdef...",
      "createdAt": "2024-01-01T11:00:00.000Z"
    }
  ],
  "total": 45,
  "hasMore": true
}
```

## 📱 WhatsApp Integration

### Webhook Verification
**GET** `/whatsapp/webhook`

WhatsApp webhook verification endpoint.

**Query Parameters**:
- `hub.mode` (string) - Should be "subscribe"
- `hub.challenge` (string) - Challenge token
- `hub.verify_token` (string) - Verification token

**Response**: Challenge token if verified, 403 if invalid

### Message Processing
**POST** `/whatsapp/webhook`

Process incoming WhatsApp messages.

**Request Body** (WhatsApp Webhook Format):
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+1234567890",
              "phone_number_id": "123456789"
            },
            "messages": [
              {
                "from": "+1234567890",
                "id": "msg_123456789",
                "timestamp": "1234567890",
                "text": {
                  "body": "balance"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response**: 200 OK with processing status

### Status Updates
**POST** `/whatsapp/webhook/status`

Process WhatsApp message status updates.

**Request Body** (WhatsApp Status Format):
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "statuses": [
              {
                "id": "msg_123456789",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "+1234567890"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Send Message (Testing)
**POST** `/api/whatsapp/send`

Send WhatsApp message for testing.

**Request Body**:
```json
{
  "to": "+1234567890",
  "message": "Hello! Your balance is 100 USDC",
  "messageType": "text"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_123456789",
  "to": "+1234567890",
  "messageType": "text",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Send Template
**POST** `/api/whatsapp/templates`

Send WhatsApp template message.

**Request Body**:
```json
{
  "templateName": "balance_update",
  "to": "+1234567890",
  "parameters": {
    "balance": "100",
    "currency": "USDC"
  }
}
```

### WhatsApp Status
**GET** `/api/whatsapp/status`

Get WhatsApp integration status.

**Response**:
```json
{
  "status": "configured",
  "configuration": {
    "webhookConfigured": true,
    "accessTokenConfigured": true,
    "phoneNumberIdConfigured": true,
    "businessAccountIdConfigured": true,
    "appIdConfigured": true
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### WhatsApp Health
**GET** `/api/whatsapp/health`

WhatsApp integration health check.

**Response**:
```json
{
  "service": "whatsapp",
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "features": {
    "webhook": true,
    "messaging": true,
    "templates": true
  }
}
```

## 🚨 Error Handling

### Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "amount",
      "issue": "must be a positive number"
    },
    "requestId": "req_1234567890abcdef",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| VALIDATION_ERROR | Invalid input parameters | 400 |
| NOT_FOUND | Resource not found | 404 |
| UNAUTHORIZED | Authentication required | 401 |
| FORBIDDEN | Access denied | 403 |
| RATE_LIMITED | Too many requests | 429 |
| INTERNAL_ERROR | Server error | 500 |
| BLOCKCHAIN_ERROR | Blockchain operation failed | 502 |
| WHATSAPP_ERROR | WhatsApp API error | 502 |

### Rate Limiting

**Headers**:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Window reset timestamp

**Limits**:
- Global: 100 requests per 15 minutes
- Sensitive endpoints: 10 requests per minute
- WhatsApp operations: 1000 messages per day (WhatsApp limit)

---

**API Version**: 1.0.0
**Last Updated**: 2024-01-01
**Status**: Production Ready
