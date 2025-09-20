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
      <div className="space-y-3 relative">
        {/* Main Crypto Info */}
        <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br shadow-inner ${
              currency === 'USDC' 
                ? 'from-crypto-usdc to-blue-500 text-white' 
                : 'from-gray-600 to-gray-700 text-white'
            } transform transition-transform duration-300 hover:scale-105`}>
              <span className="text-xl font-bold">{currency === 'USDC' ? '$' : 'Ξ'}</span>
            </div>
            <div>
              <div className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                <span className="mr-1.5">{amount}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  currency === 'USDC' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {currency}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize flex items-center">
                {action === 'send' && (
                  <><span className="text-red-500 mr-1">↗</span> Sent</>
                )}
                {action === 'receive' && (
                  <><span className="text-green-500 mr-1">↘</span> Received</>
                )}
                {action === 'buy' && (
                  <><span className="text-purple-500 mr-1">🛒</span> Purchase</>
                )}
                {action === 'balance' && (
                  <><span className="text-blue-500 mr-1">💰</span> Balance</>
                )}
              </div>
            </div>
          </div>
          
          {action !== 'balance' && (
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Network</div>
              <div className="text-sm font-bold text-crypto-base dark:text-blue-400 flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  BASE
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Address/Transaction Details */}
        {(address || txHash || fee) && (
          <div className="space-y-2.5 mt-3">
            {address && (
              <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700 group hover:border-blue-200 dark:hover:border-blue-700 transition-colors duration-200">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                  <Wallet size={12} className="mr-1 opacity-70" /> Address
                </div>
                <div className="text-sm font-mono break-all flex items-center justify-between">
                  <span className="text-gray-800 dark:text-gray-200">{address.slice(0, 6)}...{address.slice(-4)}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy Address"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {txHash && (
              <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700 group hover:border-blue-200 dark:hover:border-blue-700 transition-colors duration-200">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Transaction
                </div>
                <div className="text-sm font-mono break-all flex items-center justify-between">
                  <span className="text-gray-800 dark:text-gray-200">{txHash.slice(0, 6)}...{txHash.slice(-4)}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigator.clipboard.writeText(txHash)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mr-1"
                      title="Copy Transaction Hash"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <a 
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {fee && (
              <div className="flex items-center justify-center mt-1 bg-gray-50 dark:bg-gray-800/30 py-1.5 px-3 rounded-full mx-auto w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Network fee: {fee} ETH
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Action status badge - shows at the top right */}
        {action !== 'balance' && (
          <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md ${
            action === 'send' 
              ? 'bg-red-500 text-white' 
              : action === 'receive' 
                ? 'bg-green-500 text-white' 
                : 'bg-purple-500 text-white'
          }`}>
            {action === 'send' ? 'SENT' : action === 'receive' ? 'RECEIVED' : 'BOUGHT'}
          </div>
        )}
      </div>
    );
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4 px-4">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 text-amber-800 dark:text-amber-300 px-4 py-1.5 rounded-full text-sm max-w-xs text-center shadow-sm border border-amber-200 dark:border-amber-800/30 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4 px-1.5 group`}>
      <div
        className={`message-bubble relative ${message.isOwn ? 'own' : 'other'} 
          ${
            message.isOwn 
              ? message.type === 'crypto' 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700/50' 
                : 'bg-gradient-to-br from-whatsapp-bubble-own to-green-100 dark:from-green-900/40 dark:to-green-800/30 border border-green-200 dark:border-green-700/50'
              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
          } 
          backdrop-filter backdrop-blur-sm
          shadow-sm hover:shadow-md transition-all duration-300
          animate-slide-up transform hover:-translate-y-0.5`}
      >
        {/* Message content */}
        {message.type === 'crypto' ? (
          <>
            {message.content && (
              <p className="mb-3 text-sm dark:text-gray-200">{message.content}</p>
            )}
            {renderCryptoMessage()}
          </>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap dark:text-gray-200">
            {message.content.startsWith('/') ? (
              <code className="font-mono bg-gray-50 dark:bg-gray-700/50 px-1 py-0.5 rounded text-whatsapp-green-dark dark:text-whatsapp-green">
                {message.content}
              </code>
            ) : (
              message.content
            )}
          </p>
        )}

        {/* Timestamp and Status */}
        <div className="flex items-center justify-end gap-1.5 mt-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {formatTime(message.timestamp)}
          </span>
          <span className="transform transition-transform duration-200 group-hover:scale-110">
            {renderMessageStatus()}
          </span>
        </div>
        
        {/* Message tail/triangle */}
        <div 
          className={`absolute top-1 w-2 h-2 transform rotate-45 ${
            message.isOwn 
              ? 'right-0 translate-x-1 -translate-y-px' 
              : 'left-0 -translate-x-1 -translate-y-px'
          } ${
            message.isOwn 
              ? message.type === 'crypto'
                ? 'bg-blue-100 dark:bg-blue-900/40 border-r border-t border-blue-200 dark:border-blue-700/50'
                : 'bg-whatsapp-bubble-own dark:bg-green-900/40 border-r border-t border-green-200 dark:border-green-700/50' 
              : 'bg-white dark:bg-gray-800 border-l border-t border-gray-100 dark:border-gray-700'
          }`}
        ></div>
      </div>
    </div>
  );
}