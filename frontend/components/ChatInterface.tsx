'use client';

import { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble, { Message } from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import WalletStatus from './WalletStatus';
import MobileWalletStatus from './MobileWalletStatus';
import { useDeviceType, useTouchGestures } from './MobileOptimizations';
import MobileOptimizations from './MobileOptimizations';
import { MenuProvider } from '../lib/menu/MenuContext';
import MenuSystem from './menu/MenuSystem';
import { SlashCommandProcessor } from '../lib/commands/SlashCommandProcessor';

interface ChatInterfaceProps {
  onBack?: () => void;
}

export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  const { isMobile, isTablet } = useDeviceType();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Welcome to CryptoChap! I'm your crypto assistant for USDC on Base network.\n\n**Try these commands:**\n• /menu - Open interactive menu\n• /balance - Check wallet balance\n• /address - Get deposit address\n• /buy 50 - Purchase USDC\n• /send 10 USDC 0x... - Transfer tokens\n• /help - See all commands\n\nYou can also tap the menu button below or use traditional commands without the slash.",
      timestamp: new Date(),
      isOwn: false,
      type: 'text',
      status: 'read'
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [walletData, setWalletData] = useState({
    address: '0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93',
    usdcBalance: '1,234.56',
    ethBalance: '0.0045',
    isConnected: true
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateTyping = (duration: number = 2000) => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), duration);
  };

  const generateBotResponse = (userMessage: string): Message => {
    const timestamp = new Date();
    const lowerMsg = userMessage.toLowerCase();
    
    // Check for slash commands
    if (userMessage.startsWith('/')) {
      const parsedCommand = SlashCommandProcessor.parseCommand(userMessage);
      
      // Invalid command
      if (!parsedCommand.isValid) {
        return {
          id: Date.now().toString(),
          content: `❌ ${parsedCommand.errors?.join('\n') || 'Invalid command'}\n\nType /help for a list of available commands.`,
          timestamp,
          isOwn: false,
          type: 'text',
          status: 'read'
        };
      }
      
      // Process valid commands
      switch (parsedCommand.command) {
        case 'menu':
          return {
            id: Date.now().toString(),
            content: "📱 Opening menu...\n\nUse the interactive menu to access all CryptoChap features. You can also use slash commands like /balance, /send, etc. directly.",
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
        
        case 'balance':
          const token = parsedCommand.parameters.token || 'ALL';
          return {
            id: Date.now().toString(),
            content: token === 'ALL' 
              ? "Here's your current wallet balance:"
              : `Here's your ${token} balance:`,
            timestamp,
            isOwn: false,
            type: 'crypto',
            status: 'read',
            cryptoData: {
              amount: walletData.usdcBalance,
              currency: 'USDC',
              action: 'balance',
              address: walletData.address
            }
          };
        
        case 'address':
          return {
            id: Date.now().toString(),
            content: "Here's your Base network deposit address:",
            timestamp,
            isOwn: false,
            type: 'crypto',
            status: 'read',
            cryptoData: {
              amount: '0.00',
              currency: 'USDC',
              action: 'receive',
              address: walletData.address
            }
          };
        
        case 'buy':
          const buyAmount = parsedCommand.parameters.amount || 50;
          return {
            id: Date.now().toString(),
            content: `Ready to purchase ${buyAmount} USDC! Click the link below to complete your purchase:\n\nhttps://app.cryptochap.com/buy?amount=${buyAmount}&address=${walletData.address}`,
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
        
        case 'send':
          if (parsedCommand.parameters.amount && parsedCommand.parameters.token && parsedCommand.parameters.to) {
            const amount = parsedCommand.parameters.amount;
            const token = parsedCommand.parameters.token;
            const to = parsedCommand.parameters.to;
            
            return {
              id: Date.now().toString(),
              content: `Confirm sending ${amount} ${token} to ${to.slice(0,6)}...${to.slice(-4)}?\n\nReply "YES" to confirm within 2 minutes.`,
              timestamp,
              isOwn: false,
              type: 'crypto',
              status: 'read',
              cryptoData: {
                amount: amount.toString(),
                currency: token,
                action: 'send',
                address: to,
                fee: '0.0001'
              }
            };
          } else {
            return {
              id: Date.now().toString(),
              content: "To send crypto, use the format:\n/send <amount> <token> <address>\n\nExample: /send 10 USDC 0x1234...5678",
              timestamp,
              isOwn: false,
              type: 'text',
              status: 'read'
            };
          }
        
        case 'history':
          const count = parsedCommand.parameters.count || 10;
          return {
            id: Date.now().toString(),
            content: `Here are your last ${count} transactions:\n\n• Received 100 USDC - 2 hours ago\n• Sent 25 USDC - 1 day ago\n• Bought 200 USDC - 3 days ago\n\nView full history on BaseScan 📊`,
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
          
        case 'price':
          const priceToken = parsedCommand.parameters.token || 'ETH';
          return {
            id: Date.now().toString(),
            content: `Current ${priceToken} price:\n\n${priceToken}/USD: $${Math.random() * 1000 + 1000.0 + Math.random()}\n24h Change: ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%`,
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
          
        case 'help':
          const helpCommand = parsedCommand.parameters.command;
          return {
            id: Date.now().toString(),
            content: helpCommand 
              ? SlashCommandProcessor.getCommandHelp(helpCommand)
              : SlashCommandProcessor.getCommandHelp(),
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
          
        case 'settings':
          return {
            id: Date.now().toString(),
            content: "⚙️ **Settings**\n\n• Notifications: ON\n• Default Currency: USDC\n• Network: Base\n• Theme: Light\n• Security: Standard\n\nTo change settings, use specific commands like:\n/settings notifications off",
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
          
        default:
          return {
            id: Date.now().toString(),
            content: `Command /${parsedCommand.command} recognized but not yet implemented.`,
            timestamp,
            isOwn: false,
            type: 'text',
            status: 'read'
          };
      }
    }
    
    // Legacy command parsing for backward compatibility
    
    // Balance command
    if (lowerMsg.includes('balance')) {
      return {
        id: Date.now().toString(),
        content: "Here's your current wallet balance:",
        timestamp,
        isOwn: false,
        type: 'crypto',
        status: 'read',
        cryptoData: {
          amount: walletData.usdcBalance,
          currency: 'USDC',
          action: 'balance',
          address: walletData.address
        }
      };
    }

    // Address command
    if (lowerMsg.includes('address')) {
      return {
        id: Date.now().toString(),
        content: "Here's your Base network deposit address:",
        timestamp,
        isOwn: false,
        type: 'crypto',
        status: 'read',
        cryptoData: {
          amount: '0.00',
          currency: 'USDC',
          action: 'receive',
          address: walletData.address
        }
      };
    }

    // Buy command
    if (lowerMsg.includes('buy')) {
      const amount = lowerMsg.match(/\d+/)?.[0] || '50';
      return {
        id: Date.now().toString(),
        content: `Ready to purchase ${amount} USDC! Click the link below to complete your purchase:`,
        timestamp,
        isOwn: false,
        type: 'text',
        status: 'read'
      };
    }

    // Send command
    if (lowerMsg.includes('send') && lowerMsg.includes('usdc')) {
      const amount = lowerMsg.match(/(\d+(?:\.\d+)?)\s*usdc/i)?.[1] || '10';
      const toAddress = lowerMsg.match(/0x[a-fA-F0-9]{40}/)?.[0] || '0x1234...5678';
      
      return {
        id: Date.now().toString(),
        content: `Confirm sending ${amount} USDC to ${toAddress.slice(0,6)}...${toAddress.slice(-4)}?\n\nReply "YES" to confirm within 2 minutes.`,
        timestamp,
        isOwn: false,
        type: 'crypto',
        status: 'read',
        cryptoData: {
          amount,
          currency: 'USDC',
          action: 'send',
          address: toAddress,
          fee: '0.0001'
        }
      };
    }

    // Confirmation
    if (lowerMsg.includes('yes')) {
      return {
        id: Date.now().toString(),
        content: "Transaction submitted successfully!",
        timestamp,
        isOwn: false,
        type: 'crypto',
        status: 'read',
        cryptoData: {
          amount: '10.00',
          currency: 'USDC',
          action: 'send',
          txHash: '0x1a2b3c4d5e6f789012345678901234567890abcdef1234567890abcdef123456',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          fee: '0.0001'
        }
      };
    }

    // History command
    if (lowerMsg.includes('history')) {
      return {
        id: Date.now().toString(),
        content: "Here are your recent transactions:\n\n• Received 100 USDC - 2 hours ago\n• Sent 25 USDC - 1 day ago\n• Bought 200 USDC - 3 days ago\n\nView full history on BaseScan 📊",
        timestamp,
        isOwn: false,
        type: 'text',
        status: 'read'
      };
    }

    // Default response - suggest using slash commands
    return {
      id: Date.now().toString(),
      content: "👋 I'm your crypto assistant for USDC on Base network.\n\n**Try these slash commands:**\n• /menu - Open interactive menu\n• /balance - Check wallet balance\n• /address - Get deposit address\n• /buy 50 - Purchase USDC\n• /send 10 USDC 0x... - Transfer tokens\n• /history - View transactions\n• /help - See all commands\n\nWhat would you like to do? 💰",
      timestamp,
      isOwn: false,
      type: 'text',
      status: 'read'
    };
  };

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isOwn: true,
      type: 'text',
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);

    // Update status to sent
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 500);

    // Simulate bot typing
    simulateTyping();

    // Generate and add bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(content);
      setMessages(prev => [...prev, botResponse]);
      
      // Update user message status to read
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
        ));
      }, 1000);
    }, 2500);
  };

  const handleWalletRefresh = async () => {
    // In a real app, this would fetch actual wallet data
    setWalletData(prev => ({
      ...prev,
      usdcBalance: (parseFloat(prev.usdcBalance.replace(',', '')) + Math.random() * 10).toFixed(2),
      ethBalance: (parseFloat(prev.ethBalance) + Math.random() * 0.001).toFixed(4)
    }));
  };

  // Add swipe gestures for mobile navigation
  useTouchGestures(
    () => isMobile && onBack?.(),
    undefined
  );
  
  // Handle menu command execution
  const handleMenuCommand = (command: string) => {
    if (command.startsWith('/')) {
      handleSendMessage(command);
    }
  };

  return (
    <MenuProvider onExecuteCommand={handleMenuCommand}>
      <MobileOptimizations>
        <div className={`flex flex-col bg-gray-50 dark:bg-gray-900 ${
          isMobile ? 'h-screen chat-container-mobile' : 'h-screen chat-container-desktop'
        } overflow-hidden`}>
          {/* Decorative background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200 dark:bg-blue-900/30 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-green-200 dark:bg-whatsapp-green/20 rounded-full opacity-20 blur-3xl"></div>
          </div>
          
          {/* Header */}
          <ChatHeader
            contactName="CryptoChap Bot"
            contactStatus="Online • USDC on Base"
            isOnline={true}
            onBack={onBack}
          />

          {/* Wallet Status - Collapsible on mobile */}
          {!isMobile && (
            <WalletStatus
              address={walletData.address}
              usdcBalance={walletData.usdcBalance}
              ethBalance={walletData.ethBalance}
              isConnected={walletData.isConnected}
              onRefresh={handleWalletRefresh}
            />
          )}

          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 messages-background ${
              isMobile ? 'px-3 py-3 messages-container-mobile' : 'px-5 py-5 messages-container-desktop'
            }`}
          >
            <div className="min-h-full flex flex-col justify-end">
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-gray-100/80 dark:from-gray-800/80 to-transparent z-10 pointer-events-none"></div>
            <ChatInput
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              placeholder="Message CryptoChap..."
            />
          </div>

          {/* Mobile Wallet Status */}
          {isMobile && (
            <MobileWalletStatus
              address={walletData.address}
              usdcBalance={walletData.usdcBalance}
              ethBalance={walletData.ethBalance}
              isConnected={walletData.isConnected}
              onRefresh={handleWalletRefresh}
            />
          )}
        </div>

        {/* Menu System */}
        <MenuSystem onExecuteCommand={handleMenuCommand} />
        
      </MobileOptimizations>
    </MenuProvider>
  );
}