import { WhatsAppInteractiveMessage } from '../whatsapp/templates';

/**
 * WhatsApp message types supported by the API
 */
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

/**
 * WhatsApp message response from the API
 */
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

/**
 * WhatsApp API error response
 */
export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

/**
 * Service for interacting with WhatsApp Business API
 */
export class WhatsAppService {
  private phoneNumberId: string;
  private token: string;
  private apiVersion: string;
  private baseUrl: string;
  private isTokenValid: boolean = false;

  /**
   * Create a new WhatsApp service instance
   */
  constructor() {
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    this.token = process.env.META_WHATSAPP_TOKEN || '';
    this.apiVersion = process.env.META_API_VERSION || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    
    // Validate required configuration
    this.validateConfiguration();
  }

  /**
   * Validate the service configuration
   */
  private validateConfiguration(): void {
    if (!this.phoneNumberId) {
      console.error('WhatsAppService: META_PHONE_NUMBER_ID is missing');
    }
    
    if (!this.token) {
      console.error('WhatsAppService: META_WHATSAPP_TOKEN is missing');
    } else {
      // Mark token as valid for basic checks
      this.isTokenValid = true;
      console.log('WhatsAppService: Initialized with token (first 10 chars):', 
        this.token.substring(0, 10) + '...');
    }
  }
  
  /**
   * Check if the service is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.phoneNumberId && this.token);
  }

  /**
   * Send a text message to a WhatsApp number
   * 
   * @param to The recipient phone number with country code (no '+')
   * @param text The message text
   * @returns Promise with the API response
   */
  public async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text
      }
    };
    
    return this.sendMessage(message);
  }

  /**
   * Send an interactive message (buttons/lists) to a WhatsApp number
   * 
   * @param message The interactive message object
   * @returns Promise with the API response
   */
  public async sendInteractiveMessage(message: WhatsAppInteractiveMessage): Promise<WhatsAppMessageResponse> {
    return this.sendMessage(message);
  }

  /**
   * Send a template message to a WhatsApp number
   * 
   * @param to The recipient phone number with country code (no '+')
   * @param templateName The name of the approved template
   * @param languageCode The language code (e.g., 'en_US')
   * @param components Optional template components
   * @returns Promise with the API response
   */
  public async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'en', 
    components?: Array<any>
  ): Promise<WhatsAppMessageResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    };
    
    return this.sendMessage(message);
  }

  /**
   * Send a WhatsApp message using the Meta API
   * 
   * @param message The message object to send
   * @returns Promise with the API response
   */
  public async sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResponse> {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp service is not properly configured');
    }
    
    console.log(`Sending ${message.type} message to ${message.to}...`);
    
    const apiUrl = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      const data = await response.text();
      console.log(`WhatsApp API status: ${response.status}`);
      
      // Try to parse as JSON
      let parsedData: any;
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.log('Response is not valid JSON:', data);
        throw new Error(`Invalid JSON response: ${data}`);
      }
      
      // Check for API errors
      if (!response.ok) {
        const errorResponse = parsedData as WhatsAppErrorResponse;
        
        // Specifically handle token errors
        if (response.status === 401) {
          this.isTokenValid = false;
          console.error('WhatsApp token is invalid or expired!');
        }
        
        console.error('WhatsApp API error:', errorResponse);
        throw new Error(`WhatsApp API error (${response.status}): ${errorResponse.error?.message || 'Unknown error'}`);
      }
      
      console.log('Message sent successfully!');
      return parsedData as WhatsAppMessageResponse;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
  
  /**
   * Verify if a webhook request is authentic using the x-hub-signature-256 header
   * 
   * @param payload The raw request body
   * @param signature The signature from x-hub-signature-256 header
   * @returns boolean indicating if signature is valid
   */
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!process.env.META_APP_SECRET) {
      console.warn('META_APP_SECRET is not set, webhook signature verification will fail');
      return false;
    }
    
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(`sha256=${expectedSignature}`),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
  
  /**
   * Verify if a token is valid with the Meta API
   * 
   * @returns Promise<boolean> indicating if the token is valid
   */
  public async verifyToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }
    
    try {
      // The /me endpoint can be used to verify token validity
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const isValid = response.ok;
      this.isTokenValid = isValid;
      
      if (!isValid) {
        const errorData = await response.json();
        console.error('Token validation failed:', errorData);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying token:', error);
      this.isTokenValid = false;
      return false;
    }
  }
}

// Create a singleton instance
export const whatsappService = new WhatsAppService();
