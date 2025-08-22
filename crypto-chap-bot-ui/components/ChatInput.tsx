'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, DollarSign, Wallet } from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = [
    { label: 'Balance', command: 'balance', icon: Wallet, color: 'text-blue-600' },
    { label: 'Address', command: 'address', icon: Wallet, color: 'text-green-600' },
    { label: 'Buy USDC', command: 'buy 50', icon: DollarSign, color: 'text-purple-600' },
    { label: 'History', command: 'history', icon: Paperclip, color: 'text-orange-600' },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isTyping) {
      onSendMessage(message.trim());
      setMessage('');
      setShowQuickActions(false);
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
    onSendMessage(command);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, you would implement voice recording here
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            {quickActions.map((action) => (
              <button
                key={action.command}
                onClick={() => handleQuickAction(action.command)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full whitespace-nowrap transition-colors"
              >
                <action.icon size={16} className={action.color} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3 p-4">
        {/* Attachment Button */}
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`p-2 rounded-full transition-colors ${
            showQuickActions 
              ? 'bg-whatsapp-green text-white' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <DollarSign size={20} />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-2 pr-12 focus:border-whatsapp-green focus:outline-none max-h-24 min-h-[40px] leading-relaxed"
            rows={1}
            disabled={isTyping}
          />
          
          {/* Character count for longer messages */}
          {message.length > 100 && (
            <div className="absolute -top-6 right-0 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <button
            onClick={handleSend}
            disabled={isTyping}
            className="p-2 bg-whatsapp-green text-white rounded-full hover:bg-whatsapp-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording... Tap to stop
          </div>
        </div>
      )}
    </div>
  );
}