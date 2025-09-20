'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Clock, Check, AlertTriangle, ExternalLink, Copy } from 'lucide-react';

export interface TransactionData {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'buy';
  status: 'pending' | 'completed' | 'failed';
  amount: string;
  currency: string;
  timestamp: string | Date;
  recipient?: {
    name?: string;
    address: string;
  };
  sender?: {
    name?: string;
    address: string;
  };
  fee?: string;
  hash?: string;
  explorerUrl?: string;
}

interface TransactionCardProps {
  transaction: TransactionData;
  compact?: boolean;
  onViewDetails?: (txId: string) => void;
}

export default function TransactionCard({ 
  transaction, 
  compact = false,
  onViewDetails 
}: TransactionCardProps) {
  const { 
    id, type, status, amount, currency, timestamp, 
    recipient, sender, fee, hash, explorerUrl 
  } = transaction;
  
  const formatDate = (date: string | Date) => {
    const txDate = typeof date === 'string' ? new Date(date) : date;
    return txDate.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={compact ? 16 : 20} />;
      case 'completed':
        return <Check className="text-green-500" size={compact ? 16 : 20} />;
      case 'failed':
        return <AlertTriangle className="text-red-500" size={compact ? 16 : 20} />;
      default:
        return null;
    }
  };
  
  const getTypeIcon = () => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="text-red-500" size={compact ? 16 : 20} />;
      case 'receive':
        return <ArrowDownLeft className="text-green-500" size={compact ? 16 : 20} />;
      default:
        return null;
    }
  };
  
  const getCurrencyColor = () => {
    switch (currency.toLowerCase()) {
      case 'usdc':
        return 'bg-crypto-usdc';
      case 'eth':
        return 'bg-gray-700';
      default:
        return 'bg-blue-600';
    }
  };
  
  const getStatusClass = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onViewDetails && onViewDetails(id)}
        className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 
          dark:border-gray-700 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md"
      >
        <div className={`w-8 h-8 ${getCurrencyColor()} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
          {currency.slice(0, 1)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {getTypeIcon()}
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {type === 'send' ? 'Sent' : 'Received'} {currency}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {type === 'send' ? '-' : '+'}{amount}
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(timestamp)}
            </div>
            <div className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${getStatusClass()}`}>
              {getStatusIcon()}
              <span>{status}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-100 
        dark:border-gray-700 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className={`absolute top-0 right-0 w-32 h-32 ${getCurrencyColor()} rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2`}></div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between relative z-10 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${getCurrencyColor()} rounded-full flex items-center justify-center text-white shadow-md`}>
            {type === 'send' ? (
              <ArrowUpRight size={24} />
            ) : (
              <ArrowDownLeft size={24} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {type === 'send' ? 'Sent' : 'Received'} {currency}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {formatDate(timestamp)}
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${getStatusClass()}`}>
          {getStatusIcon()}
          <span className="font-medium capitalize">{status}</span>
        </div>
      </div>
      
      {/* Transaction details */}
      <div className="space-y-4 relative z-10">
        {/* Amount */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${getCurrencyColor()} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {currency === 'USDC' ? '$' : 'Ξ'}
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {amount} {currency}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currency === 'USDC' ? `≈ $${amount} USD` : ''}
            </div>
          </div>
        </div>
        
        {/* From/To */}
        {type === 'send' && recipient && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">To</div>
            <div className="flex items-center justify-between">
              <div>
                {recipient.name && (
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {recipient.name}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {formatAddress(recipient.address)}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(recipient.address)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <Copy size={14} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {type === 'receive' && sender && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">From</div>
            <div className="flex items-center justify-between">
              <div>
                {sender.name && (
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {sender.name}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {formatAddress(sender.address)}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(sender.address)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <Copy size={14} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Fee */}
        {fee && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Network Fee</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  Ξ
                </div>
                <span className="text-gray-900 dark:text-white">{fee} ETH</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gas</div>
            </div>
          </div>
        )}
        
        {/* Hash/Link */}
        {hash && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {formatAddress(hash)}
                </span>
                <button 
                  onClick={() => copyToClipboard(hash)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  <Copy size={14} className="text-gray-500 dark:text-gray-400" />
                </button>
                {explorerUrl && (
                  <a 
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                  >
                    <ExternalLink size={14} className="text-blue-500" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Button */}
        {onViewDetails && (
          <button 
            onClick={() => onViewDetails(id)}
            className="w-full mt-2 bg-gradient-to-r from-whatsapp-green to-blue-600 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            View Details
          </button>
        )}
      </div>
    </motion.div>
  );
}