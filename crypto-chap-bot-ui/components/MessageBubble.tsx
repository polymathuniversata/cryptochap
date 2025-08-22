'use client';

import { Check, CheckCheck, Clock, DollarSign, Wallet, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  type: 'text' | 'crypto' | 'system';
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  cryptoData?: {
    amount: string;
    currency: 'USDC' | 'ETH';
    action: 'send' | 'receive' | 'buy' | 'balance';
    txHash?: string;
    address?: string;
    fee?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderMessageStatus = () => {
    if (!message.isOwn) return null;

    switch (message.status) {
      case 'sending':
        return <Clock size={12} className="text-gray-400" />;
      case 'sent':
        return <Check size={12} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={12} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return <Check size={12} className="text-gray-400" />;
    }
  };

  const renderCryptoMessage = () => {
    if (!message.cryptoData) return null;

    const { amount, currency, action, txHash, address, fee } = message.cryptoData;

    return (
      <div className="space-y-3">
        {/* Main Crypto Info */}
        <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currency === 'USDC' ? 'bg-crypto-usdc text-white' : 'bg-gray-600 text-white'
            }`}>
              {currency === 'USDC' ? '$' : 'Ξ'}
            </div>
            <div>
              <div className="font-semibold text-lg">
                {amount} {currency}
                <span className={`crypto-badge ${currency.toLowerCase()}`}>
                  {currency}
                </span>
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {action === 'send' ? '→ Sent' : action === 'receive' ? '← Received' : action === 'buy' ? '🛒 Purchase' : '💰 Balance'}
              </div>
            </div>
          </div>
          
          {action !== 'balance' && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Network</div>
              <div className="text-sm font-medium text-crypto-base flex items-center gap-1">
                Base
                <span className="crypto-badge base">BASE</span>
              </div>
            </div>
          )}
        </div>

        {/* Address/Transaction Details */}
        {(address || txHash) && (
          <div className="space-y-2">
            {address && (
              <div className="bg-white/30 rounded-lg p-2">
                <div className="text-xs text-gray-600 mb-1">Address</div>
                <div className="text-sm font-mono break-all flex items-center justify-between">
                  <span>{address.slice(0, 8)}...{address.slice(-6)}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    <Wallet size={12} />
                  </button>
                </div>
              </div>
            )}
            
            {txHash && (
              <div className="bg-white/30 rounded-lg p-2">
                <div className="text-xs text-gray-600 mb-1">Transaction</div>
                <div className="text-sm font-mono break-all flex items-center justify-between">
                  <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                  <a 
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-white/50 rounded text-blue-600"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
            
            {fee && (
              <div className="text-xs text-gray-500 text-center">
                Network fee: {fee} ETH
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm max-w-xs text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`message-bubble ${message.isOwn ? 'own' : 'other'} ${
          message.isOwn 
            ? message.type === 'crypto' 
              ? 'bg-whatsapp-bubble-crypto' 
              : 'bg-whatsapp-bubble-own'
            : 'bg-white'
        } animate-slide-up`}
      >
        {message.type === 'crypto' ? (
          <>
            {message.content && (
              <p className="mb-3 text-sm">{message.content}</p>
            )}
            {renderCryptoMessage()}
          </>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {/* Timestamp and Status */}
        <div className="flex items-center justify-end gap-1 mt-2">
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
          {renderMessageStatus()}
        </div>
      </div>
    </div>
  );
}