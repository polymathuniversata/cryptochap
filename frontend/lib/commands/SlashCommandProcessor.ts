import { CommandValidator } from './CommandValidator';
import { CommandRegistry } from './CommandRegistry';

export interface SlashCommand {
  command: string;
  description: string;
  usage: string;
  aliases?: string[];
  parameters?: CommandParameter[];
  category: 'wallet' | 'transaction' | 'system' | 'defi';
  requiresConfirmation?: boolean;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'address' | 'phone' | 'token' | 'optional';
  description: string;
  required: boolean;
  validation?: (value: string) => boolean;
}

export interface ParsedCommand {
  command: string;
  parameters: Record<string, any>;
  rawInput: string;
  isValid: boolean;
  errors?: string[];
}

export class SlashCommandProcessor {
  /**
   * Initialize the SlashCommandProcessor
   */
  static initialize() {
    CommandRegistry.initialize();
  }

  /**
   * Parse a command string into a structured command object
   */
  static parseCommand(input: string): ParsedCommand {
    // Initialize command registry if needed
    CommandRegistry.initialize();
    
    const trimmed = input.trim();
    
    // Check if it's a slash command
    if (!trimmed.startsWith('/')) {
      return {
        command: '',
        parameters: {},
        rawInput: input,
        isValid: false,
        errors: ['Not a slash command']
      };
    }

    // Parse command and parameters
    const parts = trimmed.slice(1).split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = CommandRegistry.getCommand(commandName);
    if (!command) {
      return {
        command: commandName,
        parameters: {},
        rawInput: input,
        isValid: false,
        errors: [`Unknown command: /${commandName}`]
      };
    }

    // Validate parameters
    const result = this.validateParameters(command, args);
    
    return {
      command: command.command,
      parameters: result.parameters,
      rawInput: input,
      isValid: result.isValid,
      errors: result.errors
    };
  }

  /**
   * Validate command parameters
   */
  private static validateParameters(command: SlashCommand, args: string[]) {
    const parameters: Record<string, any> = {};
    const errors: string[] = [];
    
    if (!command.parameters) {
      return { parameters, errors: [], isValid: true };
    }

    let argIndex = 0;
    
    for (const param of command.parameters) {
      const value = args[argIndex];
      
      if (param.required && !value) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }
      
      if (value) {
        // Type conversion and validation
        switch (param.type) {
          case 'number':
            const num = parseFloat(value);
            if (isNaN(num)) {
              errors.push(`Parameter ${param.name} must be a number`);
            } else if (param.validation && !param.validation(value)) {
              errors.push(`Invalid value for ${param.name}`);
            } else {
              parameters[param.name] = num;
            }
            break;
            
          case 'token':
            parameters[param.name] = value.toUpperCase();
            if (param.validation && !param.validation(value)) {
              errors.push(`Unsupported token: ${value}`);
            }
            break;
            
          case 'address':
            if (!CommandValidator.isValidAddress(value)) {
              errors.push(`Invalid address format: ${value}`);
            } else {
              parameters[param.name] = value;
            }
            break;
            
          case 'phone':
            if (!CommandValidator.isValidPhone(value)) {
              errors.push(`Invalid phone number format: ${value}`);
            } else {
              parameters[param.name] = value;
            }
            break;
            
          default:
            parameters[param.name] = value;
            if (param.validation && !param.validation(value)) {
              errors.push(`Invalid value for ${param.name}`);
            }
        }
        argIndex++;
      }
    }

    return {
      parameters,
      errors,
      isValid: errors.length === 0
    };
  }

  /**
   * Get all available commands, optionally filtered by category
   */
  static getAvailableCommands(category?: string): SlashCommand[] {
    return CommandRegistry.getAllCommands(category);
  }

  /**
   * Get command suggestions based on partial input
   */
  static getCommandSuggestions(partial: string): SlashCommand[] {
    if (!partial.startsWith('/')) return [];
    
    const search = partial.slice(1).toLowerCase();
    return CommandRegistry.searchCommands(search, 5);
  }

  /**
   * Get help text for a specific command or all commands
   */
  static getCommandHelp(commandName?: string): string {
    if (!commandName) {
      const categories = {
        'wallet': 'Wallet Management',
        'transaction': 'Transactions',
        'defi': 'DeFi & Prices',
        'system': 'System Commands'
      };
      
      let help = '🤖 **CryptoChap Commands**\n\n';
      
      for (const [category, title] of Object.entries(categories)) {
        const commands = this.getAvailableCommands(category);
        if (commands.length > 0) {
          help += `**${title}:**\n`;
          commands.forEach(cmd => {
            help += `• \`/${cmd.command}\` - ${cmd.description}\n`;
          });
          help += '\n';
        }
      }
      
      help += 'Type `/help <command>` for detailed usage.';
      return help;
    }

    const command = CommandRegistry.getCommand(commandName.toLowerCase());
    if (!command) {
      return `Command /${commandName} not found. Type /help for available commands.`;
    }

    let help = `**/${command.command}** - ${command.description}\n\n`;
    help += `**Usage:** \`${command.usage}\`\n`;
    
    if (command.aliases && command.aliases.length > 0) {
      help += `**Aliases:** ${command.aliases.map(a => `/${a}`).join(', ')}\n`;
    }
    
    if (command.parameters && command.parameters.length > 0) {
      help += '\n**Parameters:**\n';
      command.parameters.forEach(param => {
        const required = param.required ? '(required)' : '(optional)';
        help += `• \`${param.name}\` ${required} - ${param.description}\n`;
      });
    }

    return help;
  }
  
  /**
   * Execute a command and generate a response
   */
  static async executeCommand(parsedCommand: ParsedCommand): Promise<string> {
    // Here you would implement command execution logic
    // For now, we'll return a placeholder message
    if (!parsedCommand.isValid) {
      const errorMsg = parsedCommand.errors?.join('\n') || 'Invalid command';
      return `❌ ${errorMsg}\n\n${CommandValidator.getHelpMessage(parsedCommand.command)}`;
    }
    
    return CommandValidator.formatSuccess(parsedCommand);
  }
}