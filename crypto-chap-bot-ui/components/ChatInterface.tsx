'use client';

import { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble, { Message } from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import WalletStatus from './WalletStatus';
import MobileWalletStatus from './MobileWalletStatus';
import { useDeviceType, MobileViewportOptimizer, useTouchGestures } from './MobileOptimizations';

interface ChatInterfaceProps {
  onBack?: () => void;
}

export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  const { isMobile, isTablet } = useDeviceType();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Welcome to CryptoChap! I'm your crypto assistant for USDC on Base network.\n\nTry these commands:\n• balance - Check your wallet\n• address - Get your deposit address\n• buy 50 - Purchase USDC\n• send 10 USDC to 0x... - Transfer tokens\n• history - View transactions",
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

    // Default response
    return {
      id: Date.now().toString(),
      content: "I understand you want to interact with crypto! Here are the commands I support:\n\n• balance - Check wallet balance\n• address - Get deposit address\n• buy [amount] - Purchase USDC\n• send [amount] USDC to [address] - Transfer\n• history - Transaction history\n\nWhat would you like to do? 💰",
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

  return (
    <MobileViewportOptimizer>
      <div className={`flex flex-col bg-whatsapp-gray-light ${
        isMobile ? 'h-screen' : 'h-screen'
      }`} style={{ height: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh' }}>
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
        className={`flex-1 overflow-y-auto chat-pattern scrollbar-thin ${
          isMobile ? 'px-3 py-3' : 'px-4 py-4'
        }`}
        style={{ 
          maxHeight: isMobile 
            ? 'calc(var(--vh, 1vh) * 100 - 130px)' 
            : 'calc(100vh - 280px)' 
        }}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        placeholder="Message CryptoChap..."
      />

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
    </MobileViewportOptimizer>
  );
}