# CryptoChap WhatsApp Integration Architecture

## Overview

This document describes the improved architecture for WhatsApp integration in the CryptoChap application. The new design follows service-oriented principles with better separation of concerns, error handling, and maintainability.

## Core Components

### 1. WhatsApp Service (`lib/services/whatsapp.service.ts`)

The WhatsApp Service handles all interactions with the WhatsApp Business API:

- Message sending (text, template, interactive)
- Webhook signature verification
- Token validation
- Error handling with proper logging

**Key features:**
- Type-safe interfaces for API interactions
- Centralized error handling
- Detailed logging
- Token validation checks

### 2. Token Management Service (`lib/services/token-management.service.ts`)

This service manages API tokens for various services:

- Token storage and retrieval
- Token validation and expiration tracking
- Automatic token updates in environment files

**Key features:**
- Persistent storage of token history
- Token validity checks
- Expiration tracking
- Easy token rotation

### 3. Logging Service (`lib/services/logging.service.ts`)

A structured logging service to improve debugging and monitoring:

- Consistent log format
- Different log levels (DEBUG, INFO, WARN, ERROR)
- Context-aware logging
- Environment-specific log levels

### 4. Webhook Handler (`app/api/whatsapp/webhook/route.ts`)

The webhook handler processes incoming WhatsApp messages:

- Uses services for business logic
- Better separation of concerns
- Improved error handling
- Detailed logging

## Tools and Utilities

### 1. Token Management CLI (`scripts/manage-tokens.ts`)

A command-line tool for managing WhatsApp tokens:

```
./manage-whatsapp.ps1
```

Features:
- Check token validity
- Update tokens
- Test WhatsApp service
- View configuration

### 2. Enhanced Webhook Testing (`scripts/webhook-test-enhanced.js`)

An interactive tool for testing the webhook:

```
./test-webhook-enhanced.ps1
```

Features:
- Test different message types
- Interactive menu
- Detailed results
- Comprehensive test cases

## Architecture Benefits

1. **Maintainability**
   - Clear separation of concerns
   - Service-oriented design
   - Easier to test individual components

2. **Error Handling**
   - Consistent error handling patterns
   - Detailed error logging
   - Token validation checks

3. **Security**
   - Better token management
   - Signature verification
   - Secure storage of sensitive information

4. **Extensibility**
   - Easy to add new message types
   - Flexible service architecture
   - Well-defined interfaces

## Flow Diagrams

### WhatsApp Message Flow

```
[User Message] -> [WhatsApp Platform] -> [Webhook Handler]
    -> [Message Processor] -> [WhatsApp Service]
    -> [Meta API] -> [User Receives Response]
```

### Token Management Flow

```
[manage-whatsapp.ps1] -> [Token Management Service]
    -> [WhatsApp Service] -> [Token Validation]
    -> [Update .env.local]
```

## Next Steps for Further Improvement

1. **Database Integration**
   - Store user sessions and context
   - Track message history
   - Persist wallet information

2. **Monitoring and Alerts**
   - Add monitoring for failed requests
   - Set up alerts for token expiration
   - Track usage metrics

3. **Conversation State Machine**
   - Implement a proper state machine for conversations
   - Context-aware responses
   - Multi-step workflows

4. **Automated Testing**
   - Unit tests for services
   - Integration tests for webhook
   - End-to-end test cases

## How to Use This Architecture

1. **Sending WhatsApp Messages**

```typescript
import { whatsappService } from '@/lib/services/whatsapp.service';

// Send text message
await whatsappService.sendTextMessage('1234567890', 'Hello from CryptoChap!');

// Send interactive message
await whatsappService.sendInteractiveMessage(WhatsAppTemplates.getMainMenuInteractive('1234567890'));
```

2. **Token Management**

```typescript
import { tokenManager } from '@/lib/services/token-management.service';

// Check if token is valid
const isValid = await whatsappService.verifyToken();

// Update token
await tokenManager.updateWhatsAppToken('NEW_TOKEN');
```

3. **Logging**

```typescript
import { logger } from '@/lib/services/logging.service';

// Different log levels
logger.debug('Debug message');
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message', error, { contextData: 'value' });
```
