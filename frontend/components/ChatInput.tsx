'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, DollarSign, Wallet, History, Menu, HelpCircle } from 'lucide-react';
import CommandSuggestions from './commands/CommandSuggestions';
import CommandHistory, { addCommandToHistory } from './commands/CommandHistory';
import { SlashCommandProcessor, ParsedCommand } from '../lib/commands/SlashCommandProcessor';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  isTyping, 
  placeholder = "Type a message..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [commandValidation, setCommandValidation] = useState<{
    isValid: boolean;
    errors?: string[];
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize slash command processor
  useEffect(() => {
    SlashCommandProcessor.initialize();
  }, []);

  // Quick action buttons for common tasks
  const quickActions = [
    { label: 'Menu', command: '/menu', icon: Menu, color: 'text-blue-600' },
    { label: 'Balance', command: '/balance', icon: Wallet, color: 'text-green-600' },
    { label: 'Buy USDC', command: '/buy 50', icon: DollarSign, color: 'text-purple-600' },
    { label: 'History', command: '/history', icon: History, color: 'text-orange-600' },
    { label: 'Help', command: '/help', icon: HelpCircle, color: 'text-gray-600' },
  ];

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Validate slash commands as the user types
  useEffect(() => {
    if (message.trim().startsWith('/')) {
      const parsedCommand = SlashCommandProcessor.parseCommand(message);
      setCommandValidation({
        isValid: parsedCommand.isValid,
        errors: parsedCommand.errors
      });
    } else {
      setCommandValidation(null);
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isTyping) {
      // Add slash commands to history
      if (message.trim().startsWith('/')) {
        addCommandToHistory(message.trim());
      }
      
      onSendMessage(message.trim());
      setMessage('');
      setShowQuickActions(false);
      setCommandValidation(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (command: string) => {
    setMessage(command);
    setShowQuickActions(false);
  };
  
  const handleSelectCommand = (command: string) => {
    setMessage(command + ' ');
    
    // Focus the textarea and place cursor at the end
    if (textareaRef.current) {
      textareaRef.current.focus();
      const length = command.length + 1;
      textareaRef.current.setSelectionRange(length, length);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, you would implement voice recording here
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 backdrop-blur-md">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {quickActions.map((action) => (
              <button
                key={action.command}
                onClick={() => handleQuickAction(action.command)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full whitespace-nowrap transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
              >
                <action.icon size={16} className={`${action.color} transition-transform duration-200 group-hover:scale-110`} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3 p-4 relative">
        {/* Menu Button */}
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            showQuickActions 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
          }`}
          title="Quick Actions"
        >
          <Menu size={18} className={`transform transition-transform ${showQuickActions ? 'rotate-90' : ''}`} />
        </button>

        {/* Command History */}
        <CommandHistory onSelectCommand={handleSelectCommand} />

        {/* Message Input */}
        <div className="flex-1 relative">
          {/* Command Suggestions */}
          <CommandSuggestions 
            inputValue={message} 
            onSelectCommand={handleSelectCommand} 
          />
          
          {/* Command Validation Errors */}
          {commandValidation && !commandValidation.isValid && commandValidation.errors && commandValidation.errors.length > 0 && (
            <div className="absolute -top-10 left-0 right-0 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-2.5 text-xs text-red-600 dark:text-red-400 shadow-sm animate-fade-in-down">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {commandValidation.errors[0]}
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={`w-full resize-none rounded-2xl border ${
              commandValidation && !commandValidation.isValid
                ? 'border-red-300 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900' 
                : message.startsWith('/') && commandValidation?.isValid 
                  ? 'border-green-300 dark:border-green-600 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-whatsapp-green/20'
            } px-4 py-3 pr-12 focus:outline-none dark:bg-gray-700 dark:text-white max-h-24 min-h-[48px] leading-relaxed shadow-sm transition-all duration-200`}
            rows={1}
            disabled={isTyping}
          />
          
          {/* Character count for longer messages */}
          {message.length > 0 && (
            <div className={`absolute -top-6 right-0 text-xs ${message.length > 900 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'} font-mono transition-colors duration-200`}>
              {message.length}/1000
            </div>
          )}
          
          {/* Slash command indicator */}
          {message.startsWith('/') && (
            <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
              <div className={`text-xs px-1.5 py-0.5 rounded-full ${
                commandValidation?.isValid 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
              }`}>
                CMD
              </div>
            </div>
          )}
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <button
            onClick={handleSend}
            disabled={isTyping || (message.startsWith('/') && commandValidation ? !commandValidation.isValid : false)}
            className="p-3 bg-gradient-to-r from-whatsapp-green to-emerald-500 text-white rounded-full hover:shadow-lg hover:shadow-whatsapp-green/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            <Send size={18} className="transform -rotate-12" />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
            }`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded-lg animate-pulse-opacity">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            Recording voice message... Tap microphone to stop
          </div>
        </div>
      )}
    </div>
  );
}