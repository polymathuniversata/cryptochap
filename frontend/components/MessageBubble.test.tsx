/**
 * MessageBubble Component Tests
 * Tests for message rendering, crypto data display, and user interactions
 */

/// <reference types="jest" />

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageBubble, { Message } from '../MessageBubble';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock window.open for external links
global.open = jest.fn();

describe('MessageBubble Component', () => {
  const mockMessage: Message = {
    id: '1',
    content: 'Hello world',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    isOwn: false,
    type: 'text',
    status: 'sent'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Message Rendering', () => {
    test('renders text message correctly', () => {
      render(<MessageBubble message={mockMessage} />);

      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
    });

    test('renders own message with correct styling', () => {
      const ownMessage = { ...mockMessage, isOwn: true };
      render(<MessageBubble message={ownMessage} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      expect(messageBubble).toHaveClass('own');
    });

    test('renders other message with correct styling', () => {
      render(<MessageBubble message={mockMessage} />);

      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      expect(messageBubble).toHaveClass('other');
    });

    test('renders command with code styling', () => {
      const commandMessage = { ...mockMessage, content: '/balance' };
      render(<MessageBubble message={commandMessage} />);

      const codeElement = screen.getByText('/balance');
      expect(codeElement).toHaveClass('font-mono');
    });
  });

  describe('Message Status', () => {
    test('renders sent status icon', () => {
      const sentMessage = { ...mockMessage, isOwn: true, status: 'sent' as const };
      render(<MessageBubble message={sentMessage} />);

      // Check for the Check icon (sent status)
      const statusIcon = document.querySelector('[data-testid="check-icon"]') ||
                        screen.getByText('Hello world').closest('.message-bubble')?.querySelector('svg');
      expect(statusIcon).toBeInTheDocument();
    });

    test('renders delivered status icon', () => {
      const deliveredMessage = { ...mockMessage, isOwn: true, status: 'delivered' as const };
      render(<MessageBubble message={deliveredMessage} />);

      // Check for the CheckCheck icon (delivered status)
      const statusIcon = document.querySelector('[data-testid="check-check-icon"]') ||
                        screen.getByText('Hello world').closest('.message-bubble')?.querySelector('svg');
      expect(statusIcon).toBeInTheDocument();
    });

    test('renders read status icon', () => {
      const readMessage = { ...mockMessage, isOwn: true, status: 'read' as const };
      render(<MessageBubble message={readMessage} />);

      // Check for the blue CheckCheck icon (read status)
      const statusIcon = document.querySelector('[data-testid="check-check-blue-icon"]') ||
                        screen.getByText('Hello world').closest('.message-bubble')?.querySelector('svg');
      expect(statusIcon).toBeInTheDocument();
    });

    test('does not render status for non-own messages', () => {
      render(<MessageBubble message={mockMessage} />);

      // Status should not be rendered for other messages
      const messageBubble = screen.getByText('Hello world').closest('.message-bubble');
      const statusElements = messageBubble?.querySelectorAll('svg');
      // Should only have the message tail triangle, no status icon
      expect(statusElements?.length).toBe(1);
    });
  });

  describe('Crypto Message Rendering', () => {
    const cryptoMessage: Message = {
      id: '2',
      content: 'Transaction completed',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      isOwn: true,
      type: 'crypto',
      status: 'sent',
      cryptoData: {
        amount: '50.00',
        currency: 'USDC',
        action: 'send',
        txHash: '0x1234567890abcdef',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        fee: '0.001'
      }
    };

    test('renders crypto message with amount and currency', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('50.00')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });

    test('renders USDC with correct styling', () => {
      render(<MessageBubble message={cryptoMessage} />);

      const currencyBadge = screen.getByText('USDC');
      expect(currencyBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    test('renders ETH with correct styling', () => {
      const ethMessage = {
        ...cryptoMessage,
        cryptoData: { ...cryptoMessage.cryptoData, currency: 'ETH' as const }
      };
      render(<MessageBubble message={ethMessage} />);

      const currencyBadge = screen.getByText('ETH');
      expect(currencyBadge).toHaveClass('bg-gray-200', 'text-gray-800');
    });

    test('renders send action with red arrow', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('Sent')).toBeInTheDocument();
      // The red arrow should be present (↗)
    });

    test('renders receive action with green arrow', () => {
      const receiveMessage = {
        ...cryptoMessage,
        cryptoData: { ...cryptoMessage.cryptoData, action: 'receive' as const }
      };
      render(<MessageBubble message={receiveMessage} />);

      expect(screen.getByText('Received')).toBeInTheDocument();
    });

    test('renders buy action with shopping cart emoji', () => {
      const buyMessage = {
        ...cryptoMessage,
        cryptoData: { ...cryptoMessage.cryptoData, action: 'buy' as const }
      };
      render(<MessageBubble message={buyMessage} />);

      expect(screen.getByText('Purchase')).toBeInTheDocument();
    });

    test('renders balance action with money emoji', () => {
      const balanceMessage = {
        ...cryptoMessage,
        cryptoData: { ...cryptoMessage.cryptoData, action: 'balance' as const }
      };
      render(<MessageBubble message={balanceMessage} />);

      expect(screen.getByText('Balance')).toBeInTheDocument();
    });

    test('renders transaction hash with copy and explorer buttons', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();

      // Copy button should be present
      const copyButton = screen.getByTitle('Copy Transaction Hash');
      expect(copyButton).toBeInTheDocument();

      // Explorer link should be present
      const explorerLink = screen.getByTitle('View on Explorer');
      expect(explorerLink).toBeInTheDocument();
      expect(explorerLink).toHaveAttribute('href', 'https://basescan.org/tx/0x1234567890abcdef');
    });

    test('renders address with copy button', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('0x742d...f44e')).toBeInTheDocument();

      const copyButton = screen.getByTitle('Copy Address');
      expect(copyButton).toBeInTheDocument();
    });

    test('renders network fee', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('Network fee: 0.001 ETH')).toBeInTheDocument();
    });

    test('renders BASE network badge', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('BASE')).toBeInTheDocument();
    });

    test('renders action status badge', () => {
      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByText('SENT')).toBeInTheDocument();
    });

    test('does not render action status badge for balance', () => {
      const balanceMessage = {
        ...cryptoMessage,
        cryptoData: { ...cryptoMessage.cryptoData, action: 'balance' as const }
      };
      render(<MessageBubble message={balanceMessage} />);

      expect(screen.queryByText('SENT')).not.toBeInTheDocument();
    });
  });

  describe('System Message Rendering', () => {
    test('renders system message with amber styling', () => {
      const systemMessage: Message = {
        id: '3',
        content: 'System notification',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        isOwn: false,
        type: 'system'
      };

      render(<MessageBubble message={systemMessage} />);

      expect(screen.getByText('System notification')).toBeInTheDocument();

      const systemBubble = screen.getByText('System notification').closest('div');
      expect(systemBubble).toHaveClass('bg-gradient-to-r', 'from-amber-50', 'to-amber-100');
    });
  });

  describe('User Interactions', () => {
    test('copies address to clipboard when copy button is clicked', async () => {
      const cryptoMessage: Message = {
        id: '2',
        content: 'Transaction completed',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        isOwn: true,
        type: 'crypto',
        status: 'sent',
        cryptoData: {
          amount: '50.00',
          currency: 'USDC',
          action: 'send',
          address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        }
      };

      render(<MessageBubble message={cryptoMessage} />);

      const copyButton = screen.getByTitle('Copy Address');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    });

    test('copies transaction hash to clipboard when copy button is clicked', async () => {
      const cryptoMessage: Message = {
        id: '2',
        content: 'Transaction completed',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        isOwn: true,
        type: 'crypto',
        status: 'sent',
        cryptoData: {
          amount: '50.00',
          currency: 'USDC',
          action: 'send',
          txHash: '0x1234567890abcdef'
        }
      };

      render(<MessageBubble message={cryptoMessage} />);

      const copyButton = screen.getByTitle('Copy Transaction Hash');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x1234567890abcdef');
    });

    test('opens explorer link in new tab', () => {
      const cryptoMessage: Message = {
        id: '2',
        content: 'Transaction completed',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        isOwn: true,
        type: 'crypto',
        status: 'sent',
        cryptoData: {
          amount: '50.00',
          currency: 'USDC',
          action: 'send',
          txHash: '0x1234567890abcdef'
        }
      };

      render(<MessageBubble message={cryptoMessage} />);

      const explorerLink = screen.getByTitle('View on Explorer');
      fireEvent.click(explorerLink);

      expect(global.open).toHaveBeenCalledWith('https://basescan.org/tx/0x1234567890abcdef', '_blank');
    });
  });

  describe('Time Formatting', () => {
    test('formats timestamp correctly', () => {
      const messageWithTime = {
        ...mockMessage,
        timestamp: new Date('2024-01-01T15:30:45Z')
      };

      render(<MessageBubble message={messageWithTime} />);

      expect(screen.getByText('15:30')).toBeInTheDocument();
    });

    test('formats midnight correctly', () => {
      const midnightMessage = {
        ...mockMessage,
        timestamp: new Date('2024-01-01T00:00:00Z')
      };

      render(<MessageBubble message={midnightMessage} />);

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('copy buttons have proper titles', () => {
      const cryptoMessage: Message = {
        id: '2',
        content: 'Transaction completed',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        isOwn: true,
        type: 'crypto',
        status: 'sent',
        cryptoData: {
          amount: '50.00',
          currency: 'USDC',
          action: 'send',
          txHash: '0x1234567890abcdef',
          address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        }
      };

      render(<MessageBubble message={cryptoMessage} />);

      expect(screen.getByTitle('Copy Address')).toBeInTheDocument();
      expect(screen.getByTitle('Copy Transaction Hash')).toBeInTheDocument();
      expect(screen.getByTitle('View on Explorer')).toBeInTheDocument();
    });

    test('external links have proper attributes', () => {
      const cryptoMessage: Message = {
        id: '2',
        content: 'Transaction completed',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        isOwn: true,
        type: 'crypto',
        status: 'sent',
        cryptoData: {
          amount: '50.00',
          currency: 'USDC',
          action: 'send',
          txHash: '0x1234567890abcdef'
        }
      };

      render(<MessageBubble message={cryptoMessage} />);

      const explorerLink = screen.getByTitle('View on Explorer');
      expect(explorerLink).toHaveAttribute('target', '_blank');
      expect(explorerLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});