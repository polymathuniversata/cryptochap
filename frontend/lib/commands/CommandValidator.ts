import { ParsedCommand } from "./SlashCommandProcessor";

// Regular expressions for validation
const VALIDATION_PATTERNS = {
  ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  PHONE: /^(\+\d{1,3}[- ]?)?\d{10,14}$/,
  DECIMAL_NUMBER: /^-?\d+(\.\d+)?$/,
  INTEGER: /^-?\d+$/,
  TOKEN_SYMBOL: /^[A-Z0-9]{1,10}$/
};

// Supported tokens
const SUPPORTED_TOKENS = ['USDC', 'ETH', 'BTC', 'SOL'];

export class CommandValidator {
  /**
   * Validate a blockchain address
   */
  static isValidAddress(address: string): boolean {
    return VALIDATION_PATTERNS.ADDRESS.test(address);
  }
  
  /**
   * Validate a phone number
   */
  static isValidPhone(phone: string): boolean {
    return VALIDATION_PATTERNS.PHONE.test(phone.replace(/\s/g, ''));
  }
  
  /**
   * Validate a recipient (address or phone)
   */
  static isValidRecipient(value: string): boolean {
    return this.isValidAddress(value) || this.isValidPhone(value);
  }
  
  /**
   * Validate a number
   */
  static isValidNumber(value: string): boolean {
    return VALIDATION_PATTERNS.DECIMAL_NUMBER.test(value);
  }
  
  /**
   * Validate an amount (positive number)
   */
  static isValidAmount(value: string): boolean {
    const num = parseFloat(value);
    return this.isValidNumber(value) && num > 0;
  }
  
  /**
   * Validate token symbols
   */
  static isValidToken(token: string): boolean {
    return SUPPORTED_TOKENS.includes(token.toUpperCase());
  }
  
  /**
   * Format error messages for display
   */
  static formatErrors(errors: string[]): string {
    if (errors.length === 0) return '';
    
    return errors.map(error => `• ${error}`).join('\n');
  }
  
  /**
   * Format a successful command for display
   */
  static formatSuccess(parsedCommand: ParsedCommand): string {
    const { command, parameters } = parsedCommand;
    
    // Format based on command type
    switch (command) {
      case 'balance':
        const token = parameters.token ? ` for ${parameters.token}` : '';
        return `Getting wallet balance${token}...`;
        
      case 'send':
        const recipient = parameters.to.startsWith('0x') 
          ? `${parameters.to.slice(0, 6)}...${parameters.to.slice(-4)}`
          : parameters.to;
        return `Sending ${parameters.amount} ${parameters.token} to ${recipient}...`;
        
      case 'buy':
        return `Preparing to buy ${parameters.amount} USDC...`;
        
      case 'address':
        return `Retrieving your wallet address...`;
        
      case 'history':
        const count = parameters.count ? ` (last ${parameters.count})` : '';
        return `Getting transaction history${count}...`;
        
      case 'price':
        return `Getting price for ${parameters.token}...`;
        
      case 'menu':
        return `Opening main menu...`;
        
      case 'settings':
        return `Opening settings...`;
        
      case 'help':
        const cmdHelp = parameters.command ? ` for ${parameters.command}` : '';
        return `Getting help${cmdHelp}...`;
        
      default:
        return `Executing /${command} command...`;
    }
  }
  
  /**
   * Get help message for command errors
   */
  static getHelpMessage(command: string): string {
    switch (command) {
      case 'send':
        return 'Usage: /send <amount> <token> <address or phone>\nExample: /send 10 USDC 0x123...abc';
      case 'buy':
        return 'Usage: /buy <amount>\nExample: /buy 50';
      case 'price':
        return 'Usage: /price <token>\nExample: /price ETH';
      default:
        return `Type /help ${command} for help with this command.`;
    }
  }
}