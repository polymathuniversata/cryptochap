import { SlashCommand, CommandParameter } from "./SlashCommandProcessor";
import { CommandValidator } from "./CommandValidator";

export class CommandRegistry {
  private static commands: Map<string, SlashCommand> = new Map();
  private static initialized = false;
  
  /**
   * Initialize the command registry with all available commands
   */
  static initialize() {
    if (this.initialized) return;
    
    const commands: SlashCommand[] = [
      // Main menu
      {
        command: 'menu',
        description: 'Show the main interactive menu',
        usage: '/menu',
        aliases: ['m', 'start', 'home'],
        category: 'system'
      },
      
      // Wallet commands
      {
        command: 'balance',
        description: 'Check your wallet balance',
        usage: '/balance [token]',
        aliases: ['bal', 'b'],
        parameters: [
          {
            name: 'token',
            type: 'token',
            description: 'Specific token (USDC, ETH)',
            required: false,
            validation: (value) => CommandValidator.isValidToken(value)
          }
        ],
        category: 'wallet'
      },
      {
        command: 'address',
        description: 'Get your wallet address',
        usage: '/address',
        aliases: ['addr', 'wallet'],
        category: 'wallet'
      },
      
      // Transaction commands
      {
        command: 'send',
        description: 'Send cryptocurrency to an address or phone',
        usage: '/send <amount> <token> <to>',
        aliases: ['transfer', 'tx'],
        parameters: [
          {
            name: 'amount',
            type: 'number',
            description: 'Amount to send',
            required: true,
            validation: (value) => CommandValidator.isValidAmount(value)
          },
          {
            name: 'token',
            type: 'token',
            description: 'Token symbol (USDC, ETH)',
            required: true,
            validation: (value) => CommandValidator.isValidToken(value)
          },
          {
            name: 'to',
            type: 'string',
            description: 'Recipient address or phone number',
            required: true,
            validation: (value) => CommandValidator.isValidRecipient(value)
          }
        ],
        category: 'transaction',
        requiresConfirmation: true
      },
      {
        command: 'buy',
        description: 'Purchase USDC with fiat currency',
        usage: '/buy <amount>',
        aliases: ['purchase'],
        parameters: [
          {
            name: 'amount',
            type: 'number',
            description: 'Amount in USD to purchase',
            required: true,
            validation: (value) => {
              const num = parseFloat(value);
              return CommandValidator.isValidNumber(value) && num >= 1 && num <= 10000;
            }
          }
        ],
        category: 'transaction'
      },
      {
        command: 'history',
        description: 'View transaction history',
        usage: '/history [count]',
        aliases: ['hist', 'h', 'tx', 'transactions'],
        parameters: [
          {
            name: 'count',
            type: 'number',
            description: 'Number of transactions (default: 10)',
            required: false,
            validation: (value) => {
              const num = parseInt(value);
              return CommandValidator.isValidNumber(value) && num > 0 && num <= 50;
            }
          }
        ],
        category: 'wallet'
      },
      
      // DeFi commands
      {
        command: 'price',
        description: 'Get current token price',
        usage: '/price <token>',
        aliases: ['p', 'quote'],
        parameters: [
          {
            name: 'token',
            type: 'token',
            description: 'Token symbol (USDC, ETH, BTC)',
            required: true,
            validation: (value) => CommandValidator.isValidToken(value)
          }
        ],
        category: 'defi'
      },
      
      // System commands
      {
        command: 'settings',
        description: 'Access user settings',
        usage: '/settings',
        aliases: ['config', 'prefs', 'options'],
        category: 'system'
      },
      {
        command: 'help',
        description: 'Show available commands',
        usage: '/help [command]',
        aliases: ['?', 'commands'],
        parameters: [
          {
            name: 'command',
            type: 'string',
            description: 'Specific command to get help for',
            required: false
          }
        ],
        category: 'system'
      }
    ];

    // Register all commands and their aliases
    commands.forEach(cmd => {
      this.commands.set(cmd.command, cmd);
      cmd.aliases?.forEach(alias => {
        this.commands.set(alias, cmd);
      });
    });
    
    this.initialized = true;
  }
  
  /**
   * Get command by name or alias
   */
  static getCommand(nameOrAlias: string): SlashCommand | undefined {
    this.ensureInitialized();
    return this.commands.get(nameOrAlias.toLowerCase());
  }
  
  /**
   * Get all available commands (filtered by category if provided)
   */
  static getAllCommands(category?: string): SlashCommand[] {
    this.ensureInitialized();
    
    // Get unique commands (no duplicates from aliases)
    const commands = Array.from(this.commands.values());
    const uniqueCommands = commands.filter((cmd, index, arr) => 
      arr.findIndex(c => c.command === cmd.command) === index
    );
    
    // Filter by category if provided
    if (category) {
      return uniqueCommands.filter(cmd => cmd.category === category);
    }
    
    return uniqueCommands;
  }
  
  /**
   * Search for commands matching a partial input
   */
  static searchCommands(partial: string, limit: number = 5): SlashCommand[] {
    this.ensureInitialized();
    
    const search = partial.toLowerCase();
    
    // Get unique commands matching the search
    const matches = Array.from(this.commands.entries())
      .filter(([key]) => key.startsWith(search))
      .map(([, cmd]) => cmd);
      
    // Remove duplicates and limit results
    return matches
      .filter((cmd, index, arr) => 
        arr.findIndex(c => c.command === cmd.command) === index
      )
      .slice(0, limit);
  }
  
  /**
   * Make sure the registry is initialized
   */
  private static ensureInitialized() {
    if (!this.initialized) {
      this.initialize();
    }
  }
}