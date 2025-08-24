import fs from 'fs';
import path from 'path';
import { whatsappService } from './whatsapp.service';

/**
 * Token information structure
 */
interface TokenInfo {
  token: string;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

/**
 * Service for managing API tokens
 */
export class TokenManagementService {
  private tokenStoragePath: string;
  private tokenStorage: Record<string, TokenInfo[]> = {};
  
  /**
   * Create a new token management service
   */
  constructor() {
    // Store tokens in a json file in a secure location
    this.tokenStoragePath = path.join(process.cwd(), '.tokens.json');
    this.loadTokens();
  }
  
  /**
   * Load tokens from storage
   */
  private loadTokens(): void {
    try {
      if (fs.existsSync(this.tokenStoragePath)) {
        const data = fs.readFileSync(this.tokenStoragePath, 'utf8');
        this.tokenStorage = JSON.parse(data);
        console.log('Tokens loaded from storage');
      } else {
        console.log('No token storage file found, creating new storage');
        this.tokenStorage = {};
        this.saveTokens();
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      this.tokenStorage = {};
    }
  }
  
  /**
   * Save tokens to storage
   */
  private saveTokens(): void {
    try {
      fs.writeFileSync(this.tokenStoragePath, JSON.stringify(this.tokenStorage, null, 2));
      console.log('Tokens saved to storage');
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }
  
  /**
   * Store a new token
   * 
   * @param type The token type (e.g., 'whatsapp')
   * @param token The token string
   * @param expiresInDays Number of days until the token expires
   */
  public storeToken(type: string, token: string, expiresInDays: number): void {
    if (!this.tokenStorage[type]) {
      this.tokenStorage[type] = [];
    }
    
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + expiresInDays);
    
    this.tokenStorage[type].push({
      token,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isValid: true
    });
    
    this.saveTokens();
  }
  
  /**
   * Get the most recent valid token of a specific type
   * 
   * @param type The token type (e.g., 'whatsapp')
   * @returns The most recent valid token or null if none found
   */
  public getLatestToken(type: string): string | null {
    if (!this.tokenStorage[type] || this.tokenStorage[type].length === 0) {
      return null;
    }
    
    // Sort by creation date (newest first)
    const sortedTokens = [...this.tokenStorage[type]]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Find the first valid token
    const validToken = sortedTokens.find(t => t.isValid && new Date(t.expiresAt) > new Date());
    
    return validToken?.token || null;
  }
  
  /**
   * Mark a token as invalid
   * 
   * @param type The token type
   * @param token The token to invalidate
   */
  public invalidateToken(type: string, token: string): void {
    if (!this.tokenStorage[type]) return;
    
    this.tokenStorage[type] = this.tokenStorage[type].map(t => {
      if (t.token === token) {
        return { ...t, isValid: false };
      }
      return t;
    });
    
    this.saveTokens();
  }
  
  /**
   * Check if a token is about to expire
   * 
   * @param type The token type
   * @param daysThreshold Number of days threshold (default: 3)
   * @returns True if the token will expire within the threshold
   */
  public isTokenExpiringSoon(type: string, daysThreshold: number = 3): boolean {
    const token = this.getLatestToken(type);
    if (!token) return true;
    
    const tokenInfo = this.tokenStorage[type].find(t => t.token === token);
    if (!tokenInfo) return true;
    
    const expiryDate = new Date(tokenInfo.expiresAt);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return expiryDate < thresholdDate;
  }
  
  /**
   * Update the current WhatsApp token in the environment
   * 
   * @param token The new token
   */
  public async updateWhatsAppToken(token: string): Promise<boolean> {
    if (!token) return false;
    
    try {
      // Update the token in the environment
      process.env.META_WHATSAPP_TOKEN = token;
      
      // Verify the token works with WhatsApp API
      const isValid = await whatsappService.verifyToken();
      
      if (isValid) {
        // Store the valid token
        this.storeToken('whatsapp', token, 60); // WhatsApp tokens typically last 60 days
        console.log('WhatsApp token updated and verified successfully');
        return true;
      } else {
        console.error('WhatsApp token verification failed');
        return false;
      }
    } catch (error) {
      console.error('Error updating WhatsApp token:', error);
      return false;
    }
  }
  
  /**
   * Update WhatsApp token in the .env.local file
   * 
   * @param token The new token
   * @returns Promise<boolean> indicating success
   */
  public async updateTokenInEnvFile(token: string): Promise<boolean> {
    if (!token) return false;
    
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      
      if (!fs.existsSync(envPath)) {
        console.error('.env.local file not found');
        return false;
      }
      
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace the token line
      const tokenRegex = /^META_WHATSAPP_TOKEN=.*/m;
      if (tokenRegex.test(envContent)) {
        envContent = envContent.replace(tokenRegex, `META_WHATSAPP_TOKEN=${token}`);
      } else {
        // Add the token if it doesn't exist
        envContent += `\nMETA_WHATSAPP_TOKEN=${token}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('WhatsApp token updated in .env.local file');
      
      return true;
    } catch (error) {
      console.error('Error updating token in .env file:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const tokenManager = new TokenManagementService();
