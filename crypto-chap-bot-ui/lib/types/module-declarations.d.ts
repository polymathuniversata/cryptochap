// This file helps TypeScript find modules
// It allows imports like @/lib/services/whatsapp.service to work

declare module '@/lib/services/whatsapp.service' {
  import { WhatsAppInteractiveMessage } from '../whatsapp/templates';

  export interface WhatsAppMessage {
    messaging_product: string;
    to: string;
    type: string;
    text?: {
      body: string;
    };
    template?: {
      name: string;
      language: {
        code: string;
      };
      components?: Array<any>;
    };
    interactive?: any;
  }

  export interface WhatsAppMessageResponse {
    messaging_product: string;
    contacts: Array<{
      input: string;
      wa_id: string;
    }>;
    messages: Array<{
      id: string;
    }>;
  }

  export interface WhatsAppErrorResponse {
    error: {
      message: string;
      type: string;
      code: number;
      error_subcode?: number;
      fbtrace_id: string;
    };
  }

  export class WhatsAppService {
    constructor();
    isConfigured(): boolean;
    sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse>;
    sendInteractiveMessage(message: WhatsAppInteractiveMessage): Promise<WhatsAppMessageResponse>;
    sendTemplateMessage(
      to: string, 
      templateName: string, 
      languageCode?: string, 
      components?: Array<any>
    ): Promise<WhatsAppMessageResponse>;
    sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResponse>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
    verifyToken(): Promise<boolean>;
  }

  export const whatsappService: WhatsAppService;
}

declare module '@/lib/services/logging.service' {
  export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
  }

  export class LoggingService {
    constructor();
    setLogLevel(level: LogLevel): void;
    debug(message: string, context?: any): void;
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, error?: any, context?: any): void;
  }

  export const logger: LoggingService;
}

declare module '@/lib/services/token-management.service' {
  export class TokenManagementService {
    constructor();
    storeToken(type: string, token: string, expiresInDays: number): void;
    getLatestToken(type: string): string | null;
    invalidateToken(type: string, token: string): void;
    isTokenExpiringSoon(type: string, daysThreshold?: number): boolean;
    updateWhatsAppToken(token: string): Promise<boolean>;
    updateTokenInEnvFile(token: string): Promise<boolean>;
  }

  export const tokenManager: TokenManagementService;
}
