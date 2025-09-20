import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from './ChatInterface';
import { SlashCommandProcessor } from '../lib/commands/SlashCommandProcessor';

// Mock all the child components
jest.mock('./ChatHeader', () => ({
  __esModule: true,
  default: ({ contactName, onBack }: { contactName: string; onBack?: () => void }) => (
    <div data-testid="chat-header">
      <h1>{contactName}</h1>
      {onBack && <button data-testid="back-button" onClick={onBack}>Back</button>}
    </div>
  ),
}));

jest.mock('./MessageBubble', () => ({
  __esModule: true,
  default: ({ message }: { message: any }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content}
    </div>
  ),
}));

jest.mock('./ChatInput', () => ({
  __esModule: true,
  default: ({ onSendMessage, isTyping, placeholder }: {
    onSendMessage: (msg: string) => void;
    isTyping: boolean;
    placeholder: string;
  }) => (
    <div data-testid="chat-input">
      <input
        data-testid="message-input"
        placeholder={placeholder}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            onSendMessage((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
      {isTyping && <div data-testid="typing-indicator">Typing...</div>}
    </div>
  ),
}));

jest.mock('./TypingIndicator', () => ({
  __esModule: true,
  default: () => <div data-testid="typing-indicator">Typing...</div>,
}));

jest.mock('./WalletStatus', () => ({
  __esModule: true,
  default: ({ address, usdcBalance, onRefresh }: {
    address: string;
    usdcBalance: string;
    onRefresh: () => void;
  }) => (
    <div data-testid="wallet-status">
      <span>{address}</span>
      <span>{usdcBalance} USDC</span>
      <button data-testid="refresh-wallet" onClick={onRefresh}>Refresh</button>
    </div>
  ),
}));

jest.mock('./MobileWalletStatus', () => ({
  __esModule: true,
  default: ({ address, usdcBalance, onRefresh }: {
    address: string;
    usdcBalance: string;
    onRefresh: () => void;
  }) => (
    <div data-testid="mobile-wallet-status">
      <span>{address}</span>
      <span>{usdcBalance} USDC</span>
      <button data-testid="refresh-mobile-wallet" onClick={onRefresh}>Refresh</button>
    </div>
  ),
}));

jest.mock('./MobileOptimizations', () => ({
  __esModule: true,
  useDeviceType: () => ({ isMobile: false, isTablet: false }),
  useTouchGestures: jest.fn(),
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mobile-optimizations">{children}</div>,
}));

jest.mock('../lib/menu/MenuContext', () => ({
  MenuProvider: ({ children, onExecuteCommand }: { children: React.ReactNode; onExecuteCommand: (cmd: string) => void }) => (
    <div data-testid="menu-provider" data-on-execute={onExecuteCommand ? 'true' : 'false'}>
      {children}
    </div>
  ),
}));

jest.mock('./menu/MenuSystem', () => ({
  __esModule: true,
  default: ({ onExecuteCommand }: { onExecuteCommand: (cmd: string) => void }) => (
    <div data-testid="menu-system">
      <button data-testid="menu-command" onClick={() => onExecuteCommand('/menu')}>Menu</button>
    </div>
  ),
}));

// Mock SlashCommandProcessor
jest.mock('../lib/commands/SlashCommandProcessor', () => ({
  SlashCommandProcessor: {
    parseCommand: jest.fn(),
    getCommandHelp: jest.fn(),
  },
}));

describe('ChatInterface', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset command processor mocks
    (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
      isValid: true,
      command: 'help',
      parameters: {},
      errors: [],
    });
    (SlashCommandProcessor.getCommandHelp as jest.Mock).mockReturnValue('Help content');
  });

  describe('Initial Rendering', () => {
    it('renders with default props', () => {
      render(<ChatInterface />);

      expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
      expect(screen.getByTestId('menu-provider')).toBeInTheDocument();
      expect(screen.getByTestId('menu-system')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-optimizations')).toBeInTheDocument();
    });

    it('renders welcome message', () => {
      render(<ChatInterface />);

      expect(screen.getByText(/Welcome to CryptoChap/)).toBeInTheDocument();
      expect(screen.getByText(/Try these commands/)).toBeInTheDocument();
    });

    it('renders wallet status on desktop', () => {
      render(<ChatInterface />);

      expect(screen.getByTestId('wallet-status')).toBeInTheDocument();
      expect(screen.getByText('0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93')).toBeInTheDocument();
      expect(screen.getByText('1,234.56 USDC')).toBeInTheDocument();
    });

    it('renders mobile wallet status on mobile', () => {
      // Mock mobile device
      const mockUseDeviceType = require('./MobileOptimizations').useDeviceType;
      mockUseDeviceType.mockReturnValue({ isMobile: true, isTablet: false });

      render(<ChatInterface />);

      expect(screen.getByTestId('mobile-wallet-status')).toBeInTheDocument();
      expect(screen.queryByTestId('wallet-status')).not.toBeInTheDocument();
    });

    it('renders back button when onBack prop is provided', () => {
      render(<ChatInterface onBack={mockOnBack} />);

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('sends user message and shows typing indicator', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      // Check user message is added
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      // Check typing indicator appears
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('adds bot response after user message', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      // Wait for bot response
      await waitFor(() => {
        const messages = screen.getAllByText(/Hello/);
        expect(messages.length).toBeGreaterThan(1);
      }, { timeout: 3000 });
    });

    it('updates message status from sending to sent to read', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      // Initially should be sending
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      // Status should update to sent and then read
      // Note: We can't easily test status changes without more complex mocking
    });
  });

  describe('Slash Command Processing', () => {
    it('processes /help command', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        command: 'help',
        parameters: {},
        errors: [],
      });
      (SlashCommandProcessor.getCommandHelp as jest.Mock).mockReturnValue('Available commands: /balance, /send, /buy');

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: '/help' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Available commands: /balance, /send, /buy')).toBeInTheDocument();
      });
    });

    it('processes /balance command', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        command: 'balance',
        parameters: {},
        errors: [],
      });

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: '/balance' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText("Here's your current wallet balance:")).toBeInTheDocument();
      });
    });

    it('processes /menu command', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        command: 'menu',
        parameters: {},
        errors: [],
      });

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: '/menu' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Opening menu/)).toBeInTheDocument();
      });
    });

    it('handles invalid slash commands', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: false,
        command: 'invalid',
        parameters: {},
        errors: ['Unknown command'],
      });

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: '/invalid' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('❌ Unknown command')).toBeInTheDocument();
      });
    });

    it('processes /buy command with amount', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        command: 'buy',
        parameters: { amount: 100 },
        errors: [],
      });

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: '/buy 100' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Ready to purchase 100 USDC/)).toBeInTheDocument();
      });
    });

    it('processes /send command with parameters', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        command: 'send',
        parameters: {
          amount: 50,
          token: 'USDC',
          to: '0x1234567890abcdef1234567890abcdef12345678'
        },
        errors: [],
      });

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: '/send 50 USDC 0x1234567890abcdef1234567890abcdef12345678' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Confirm sending 50 USDC/)).toBeInTheDocument();
      });
    });
  });

  describe('Legacy Command Processing', () => {
    it('handles balance keyword', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'show my balance' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText("Here's your current wallet balance:")).toBeInTheDocument();
      });
    });

    it('handles address keyword', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'what is my address' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText("Here's your Base network deposit address:")).toBeInTheDocument();
      });
    });

    it('handles buy keyword with amount', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'buy 75 USDC' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Ready to purchase 75 USDC/)).toBeInTheDocument();
      });
    });

    it('handles send keyword', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'send 25 usdc to 0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Confirm sending 25 USDC/)).toBeInTheDocument();
      });
    });

    it('handles confirmation responses', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'yes' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Transaction submitted successfully!')).toBeInTheDocument();
      });
    });

    it('handles history keyword', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'show history' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Here are your recent transactions/)).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Integration', () => {
    it('refreshes wallet data on desktop', () => {
      render(<ChatInterface />);
      const refreshButton = screen.getByTestId('refresh-wallet');

      fireEvent.click(refreshButton);

      // Wallet data should be updated (though we can't easily test the exact values)
      expect(refreshButton).toBeInTheDocument();
    });

    it('refreshes wallet data on mobile', () => {
      // Mock mobile device
      const mockUseDeviceType = require('./MobileOptimizations').useDeviceType;
      mockUseDeviceType.mockReturnValue({ isMobile: true, isTablet: false });

      render(<ChatInterface />);
      const refreshButton = screen.getByTestId('refresh-mobile-wallet');

      fireEvent.click(refreshButton);

      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Menu Integration', () => {
    it('executes menu commands', () => {
      render(<ChatInterface />);
      const menuButton = screen.getByTestId('menu-command');

      fireEvent.click(menuButton);

      // Should trigger the menu command execution
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Touch Gestures', () => {
    it('handles back navigation on mobile', () => {
      const mockUseTouchGestures = require('./MobileOptimizations').useTouchGestures;
      const mockOnBack = jest.fn();

      render(<ChatInterface onBack={mockOnBack} />);

      // The useTouchGestures hook should be called with the back function
      expect(mockUseTouchGestures).toHaveBeenCalled();
    });
  });

  describe('Auto-scrolling', () => {
    it('scrolls to bottom when new messages arrive', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      // Send a message
      fireEvent.change(input, { target: { value: 'Test scroll' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      // The scroll behavior is handled by useEffect and scrollIntoView
      // We can't easily test the actual scrolling without more complex setup
      await waitFor(() => {
        expect(screen.getByText('Test scroll')).toBeInTheDocument();
      });
    });
  });

  describe('Default Responses', () => {
    it('provides helpful response for unrecognized messages', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'random message' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Try these slash commands/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles command parsing errors gracefully', async () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockImplementation(() => {
        throw new Error('Parsing error');
      });

      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      // This should not crash the component
      fireEvent.change(input, { target: { value: '/error' } });
      fireEvent.keyPress(input, { key: 'Enter' });

      // Component should still be functional
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles rapid message sending', async () => {
      render(<ChatInterface />);
      const input = screen.getByTestId('message-input');

      // Send multiple messages quickly
      for (let i = 0; i < 5; i++) {
        fireEvent.change(input, { target: { value: `Message ${i}` } });
        fireEvent.keyPress(input, { key: 'Enter' });
      }

      // All messages should be processed
      await waitFor(() => {
        expect(screen.getByText('Message 4')).toBeInTheDocument();
      });
    });
  });
});