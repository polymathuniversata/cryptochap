/**
 * OpenAPI 3.0 specification for CryptoChap API
 * This provides comprehensive documentation for all API endpoints
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CryptoChap API',
    description: 'WhatsApp-native USDC crypto platform API',
    version: '1.0.0',
    contact: {
      name: 'CryptoChap Team',
      email: 'team@cryptochap.app'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server'
    },
    {
      url: 'https://api.cryptochap.app',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'JWT Authorization header using the Bearer scheme'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: 'Request validation failed'
              },
              details: {
                type: 'object',
                additionalProperties: true
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-20T10:30:00Z'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User unique identifier'
          },
          phoneNumber: {
            type: 'string',
            description: 'User phone number in international format',
            example: '+1234567890'
          },
          whatsappId: {
            type: 'string',
            description: 'WhatsApp user ID'
          },
          walletAddress: {
            type: 'string',
            description: 'User wallet address on Base network',
            example: '0x742d35Cc6345Bb0EEcE2275D8A5a2157E7d3d4c2'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the user account is active'
          },
          preferences: {
            $ref: '#/components/schemas/UserPreferences'
          }
        },
        required: ['id', 'phoneNumber', 'whatsappId', 'createdAt', 'updatedAt', 'isActive']
      },
      UserPreferences: {
        type: 'object',
        properties: {
          defaultCurrency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP'],
            default: 'USD'
          },
          notifications: {
            type: 'boolean',
            default: true
          },
          language: {
            type: 'string',
            minLength: 2,
            maxLength: 5,
            default: 'en'
          },
          timezone: {
            type: 'string',
            default: 'UTC'
          }
        }
      },
      Transaction: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          userId: {
            type: 'string',
            format: 'uuid'
          },
          type: {
            type: 'string',
            enum: ['send', 'receive', 'buy', 'sell', 'swap', 'deposit', 'withdraw']
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
          },
          amount: {
            type: 'string',
            description: 'Transaction amount as string to preserve precision',
            example: '100.50'
          },
          currency: {
            type: 'string',
            enum: ['USDC', 'ETH', 'BASE']
          },
          fromAddress: {
            type: 'string',
            description: 'Sender wallet address',
            example: '0x742d35Cc6345Bb0EEcE2275D8A5a2157E7d3d4c2'
          },
          toAddress: {
            type: 'string',
            description: 'Recipient wallet address',
            example: '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
          },
          network: {
            type: 'string',
            enum: ['base', 'ethereum', 'sepolia']
          },
          txHash: {
            type: 'string',
            description: 'Blockchain transaction hash',
            example: '0xabc123...'
          },
          gasUsed: {
            type: 'string',
            description: 'Gas used for the transaction'
          },
          gasPrice: {
            type: 'string',
            description: 'Gas price in wei'
          },
          fee: {
            type: 'string',
            description: 'Transaction fee'
          },
          metadata: {
            $ref: '#/components/schemas/TransactionMetadata'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true
          }
        },
        required: ['id', 'userId', 'type', 'status', 'amount', 'currency', 'network', 'createdAt', 'updatedAt']
      },
      TransactionMetadata: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            maxLength: 500
          },
          exchangeRate: {
            type: 'number',
            description: 'Exchange rate at transaction time'
          },
          fiatAmount: {
            type: 'number',
            description: 'Amount in fiat currency'
          },
          fiatCurrency: {
            type: 'string',
            description: 'Fiat currency code',
            example: 'USD'
          },
          reference: {
            type: 'string',
            description: 'External reference ID'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Transaction tags for categorization'
          }
        }
      },
      CreateTransactionRequest: {
        type: 'object',
        required: ['userId', 'type', 'amount', 'currency', 'network'],
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID creating the transaction'
          },
          type: {
            type: 'string',
            enum: ['send', 'receive', 'buy', 'sell', 'swap', 'deposit', 'withdraw']
          },
          amount: {
            type: 'string',
            pattern: '^\\d+(\\.\\d{1,18})?$',
            description: 'Transaction amount with up to 18 decimal places'
          },
          currency: {
            type: 'string',
            enum: ['USDC', 'ETH', 'BASE']
          },
          toAddress: {
            type: 'string',
            pattern: '^0x[a-fA-F0-9]{40}$',
            description: 'Recipient address for send transactions'
          },
          network: {
            type: 'string',
            enum: ['base', 'ethereum', 'sepolia']
          },
          description: {
            type: 'string',
            maxLength: 500
          }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          phoneNumber: {
            type: 'string',
            pattern: '^(\\+)[1-9][\\d]{0,15}$',
            description: 'Phone number in international format'
          },
          walletAddress: {
            type: 'string',
            pattern: '^0x[a-fA-F0-9]{40}$',
            description: 'Wallet address on Base network'
          },
          isActive: {
            type: 'boolean'
          },
          preferences: {
            type: 'object',
            properties: {
              defaultCurrency: {
                type: 'string',
                enum: ['USD', 'EUR', 'GBP']
              },
              notifications: {
                type: 'boolean'
              },
              language: {
                type: 'string',
                minLength: 2,
                maxLength: 5
              },
              timezone: {
                type: 'string'
              }
            }
          }
        }
      },
      SendMessageRequest: {
        type: 'object',
        required: ['to', 'message'],
        properties: {
          to: {
            type: 'string',
            pattern: '^(\\+)[1-9][\\d]{0,15}$',
            description: 'Recipient phone number'
          },
          message: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            description: 'Message content'
          },
          type: {
            type: 'string',
            enum: ['text', 'image', 'video', 'document', 'audio'],
            default: 'text'
          }
        }
      },
      PaginationOptions: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Page number (1-based)'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            description: 'Number of items per page'
          },
          sortBy: {
            type: 'string',
            enum: ['createdAt', 'updatedAt', 'amount', 'type'],
            default: 'createdAt',
            description: 'Field to sort by'
          },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
            description: 'Sort order'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              limit: {
                type: 'integer',
                description: 'Items per page'
              },
              total: {
                type: 'integer',
                description: 'Total number of items'
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages'
              },
              hasNext: {
                type: 'boolean',
                description: 'Whether there is a next page'
              },
              hasPrev: {
                type: 'boolean',
                description: 'Whether there is a previous page'
              }
            }
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          error: {
            $ref: '#/components/schemas/ApiError',
            description: 'Error information if request failed'
          },
          message: {
            type: 'string',
            description: 'Human-readable message'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          }
        },
        required: ['success', 'timestamp']
      },
      ApiError: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Error code for programmatic handling',
            example: 'VALIDATION_ERROR'
          },
          message: {
            type: 'string',
            description: 'Human-readable error message',
            example: 'Request validation failed'
          },
          details: {
            type: 'object',
            description: 'Additional error details',
            additionalProperties: true
          }
        },
        required: ['code', 'message']
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Check if the API is healthy and running',
        tags: ['System'],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API is healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieve user information by user ID',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'User ID'
          }
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update user',
        description: 'Update user information',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'User ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                        message: { type: 'string', example: 'User updated successfully' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/users/{userId}/transactions': {
      get: {
        summary: 'Get user transactions',
        description: 'Retrieve paginated list of user transactions',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'User ID'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Items per page'
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'amount', 'type'], default: 'createdAt' },
            description: 'Sort field'
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            description: 'Sort order'
          }
        ],
        responses: {
          '200': {
            description: 'Transactions retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Transaction' }
                        },
                        pagination: { $ref: '#/components/schemas/PaginatedResponse/properties/pagination' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/transactions': {
      post: {
        summary: 'Create transaction',
        description: 'Create a new transaction',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTransactionRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Transaction created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Transaction' },
                        message: { type: 'string', example: 'Transaction created successfully' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/transactions/{id}': {
      get: {
        summary: 'Get transaction by ID',
        description: 'Retrieve transaction information by transaction ID',
        tags: ['Transactions'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Transaction ID'
          }
        ],
        responses: {
          '200': {
            description: 'Transaction found',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Transaction' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': {
            description: 'Transaction not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'System',
      description: 'System health and monitoring endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Transactions',
      description: 'Transaction management endpoints'
    }
  ]
};
