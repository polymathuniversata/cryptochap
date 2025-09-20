import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInput from './ChatInput';
import { SlashCommandProcessor } from '../lib/commands/SlashCommandProcessor';

// Mock the command processor
jest.mock('../lib/commands/SlashCommandProcessor', () => ({
  SlashCommandProcessor: {
    initialize: jest.fn(),
    parseCommand: jest.fn(),
  },
}));

// Mock command history
jest.mock('./commands/CommandHistory', () => ({
  __esModule: true,
  default: ({ onSelectCommand }: { onSelectCommand: (command: string) => void }) => (
    <button
      data-testid="command-history"
      onClick={() => onSelectCommand('/test')}
    >
      History
    </button>
  ),
  addCommandToHistory: jest.fn(),
}));

// Mock command suggestions
jest.mock('./commands/CommandSuggestions', () => ({
  __esModule: true,
  default: ({ inputValue, onSelectCommand }: { inputValue: string; onSelectCommand: (command: string) => void }) => (
    <div data-testid="command-suggestions">
      {inputValue.startsWith('/') && (
        <button
          data-testid="suggestion-button"
          onClick={() => onSelectCommand('/menu')}
        >
          /menu
        </button>
      )}
    </div>
  ),
}));

describe('ChatInput', () => {
  const mockOnSendMessage = jest.fn();
  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    isTyping: false,
    placeholder: 'Type a message...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SlashCommandProcessor.initialize as jest.Mock).mockClear();
    (SlashCommandProcessor.parseCommand as jest.Mock).mockClear();
  });

  describe('Initial Rendering', () => {
    it('renders with default props', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /quick actions/i })).toBeInTheDocument();
      expect(screen.getByTestId('command-history')).toBeInTheDocument();
      expect(screen.getByTestId('command-suggestions')).toBeInTheDocument();
    });

    it('initializes slash command processor on mount', () => {
      render(<ChatInput {...defaultProps} />);

      expect(SlashCommandProcessor.initialize).toHaveBeenCalledTimes(1);
    });

    it('renders voice button when no message', () => {
      render(<ChatInput {...defaultProps} />);

      const voiceButton = screen.getByRole('button', { name: /voice/i });
      expect(voiceButton).toBeInTheDocument();
      expect(voiceButton).toHaveClass('bg-gray-100');
    });
  });

  describe('Message Input', () => {
    it('updates message state when typing', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      expect(textarea).toHaveValue('Hello world');
    });

    it('shows character count for longer messages', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: 'a'.repeat(50) } });

      expect(screen.getByText('50/1000')).toBeInTheDocument();
    });

    it('shows red character count when approaching limit', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: 'a'.repeat(950) } });

      const charCount = screen.getByText('950/1000');
      expect(charCount).toHaveClass('text-red-500');
    });
  });

  describe('Send Functionality', () => {
    it('sends message when send button is clicked', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
      expect(textarea).toHaveValue('');
    });

    it('sends message on Enter key press', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter' });

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('does not send message on Shift+Enter', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(mockOnSendMessage).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Test message');
    });

    it('does not send empty message', () => {
      render(<ChatInput {...defaultProps} />);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('does not send message when typing', () => {
      render(<ChatInput {...defaultProps} isTyping={true} />);
      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Quick Actions', () => {
    it('toggles quick actions menu', () => {
      render(<ChatInput {...defaultProps} />);
      const menuButton = screen.getByRole('button', { name: /quick actions/i });

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();

      fireEvent.click(menuButton);
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();

      fireEvent.click(menuButton);
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('inserts quick action command when clicked', () => {
      render(<ChatInput {...defaultProps} />);
      const menuButton = screen.getByRole('button', { name: /quick actions/i });

      fireEvent.click(menuButton);
      const menuAction = screen.getByText('Menu');
      fireEvent.click(menuAction);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toHaveValue('/menu');
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });
  });

  describe('Command Validation', () => {
    it('validates slash commands', () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/menu' } });

      expect(SlashCommandProcessor.parseCommand).toHaveBeenCalledWith('/menu');
    });

    it('shows validation errors for invalid commands', () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Invalid command syntax'],
      });

      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/invalid' } });

      expect(screen.getByText('Invalid command syntax')).toBeInTheDocument();
      expect(textarea).toHaveClass('border-red-300');
    });

    it('shows green border for valid commands', () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/menu' } });

      expect(textarea).toHaveClass('border-green-300');
    });

    it('shows CMD indicator for slash commands', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/menu' } });

      expect(screen.getByText('CMD')).toBeInTheDocument();
    });

    it('disables send button for invalid commands', () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Invalid command'],
      });

      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: '/invalid' } });

      expect(sendButton).toBeDisabled();
    });
  });

  describe('Voice Recording', () => {
    it('toggles recording state', () => {
      render(<ChatInput {...defaultProps} />);
      const voiceButton = screen.getByRole('button', { name: /voice/i });

      fireEvent.click(voiceButton);

      expect(screen.getByText('Recording voice message...')).toBeInTheDocument();
      expect(voiceButton).toHaveClass('bg-gradient-to-r', 'from-red-500');
    });

    it('shows recording indicator when recording', () => {
      render(<ChatInput {...defaultProps} />);
      const voiceButton = screen.getByRole('button', { name: /voice/i });

      fireEvent.click(voiceButton);

      expect(screen.getByText('Recording voice message...')).toBeInTheDocument();
      expect(screen.getByText('Tap microphone to stop')).toBeInTheDocument();
    });
  });

  describe('Command Integration', () => {
    it('integrates with command history', () => {
      render(<ChatInput {...defaultProps} />);
      const historyButton = screen.getByTestId('command-history');

      fireEvent.click(historyButton);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toHaveValue('/test ');
    });

    it('integrates with command suggestions', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/m' } });

      const suggestionButton = screen.getByTestId('suggestion-button');
      fireEvent.click(suggestionButton);

      expect(textarea).toHaveValue('/menu ');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /quick actions/i })).toHaveAttribute('title', 'Quick Actions');
    });

    it('disables textarea when typing', () => {
      render(<ChatInput {...defaultProps} isTyping={true} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      expect(textarea).toBeDisabled();
    });
  });

  describe('Auto-resize', () => {
    it('adjusts textarea height based on content', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      // Initially should have min height
      expect(textarea).toHaveStyle({ minHeight: '48px' });

      // After typing multi-line content, height should adjust
      fireEvent.change(textarea, {
        target: {
          value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5',
          scrollHeight: 120
        }
      });

      // The effect should have run and set the height
      expect(textarea).toHaveStyle({ height: '120px' });
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages', () => {
      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      const longMessage = 'a'.repeat(1000);
      fireEvent.change(textarea, { target: { value: longMessage } });

      expect(textarea).toHaveValue(longMessage);
      expect(screen.getByText('1000/1000')).toBeInTheDocument();
    });

    it('handles special characters in commands', () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/buy 50 USDC' } });

      expect(SlashCommandProcessor.parseCommand).toHaveBeenCalledWith('/buy 50 USDC');
    });

    it('resets validation state when clearing command', () => {
      (SlashCommandProcessor.parseCommand as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Invalid command'],
      });

      render(<ChatInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');

      fireEvent.change(textarea, { target: { value: '/invalid' } });
      expect(screen.getByText('Invalid command syntax')).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: 'regular message' } });
      expect(screen.queryByText('Invalid command syntax')).not.toBeInTheDocument();
    });
  });
});