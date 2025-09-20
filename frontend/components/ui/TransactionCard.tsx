'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export interface TransactionDetails {
  type: 'send' | 'receive' | 'buy' | 'sell' | 'swap';
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  token: string;
  address?: string;
  txHash?: string;
  timestamp: Date | string;
  fee?: string;
  memo?: string;
  blockNumber?: number;
  confirmations?: number;
}

interface TransactionCardProps {
  transaction: TransactionDetails;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

export default function TransactionCard({
  transaction,
  onClick,
  showDetails: initialShowDetails = false,
  className = ''
}: TransactionCardProps) {
  const [showDetails, setShowDetails] = useState(initialShowDetails);

  // Format address for display
  const formatAddress = (address?: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  // Get transaction icon based on type
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'send':
        return <ArrowUp className="text-red-500" size={18} />;
      case 'receive':
        return <ArrowDown className="text-green-500" size={18} />;
      case 'buy':
        return <ArrowDown className="text-blue-500" size={18} />;
      case 'sell':
        return <ArrowUp className="text-orange-500" size={18} />;
      case 'swap':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
            <path d="M8 5l6 6V7" />
            <path d="M16 19l-6-6v4" />
          </svg>
        );
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center"><Clock size={12} className="mr-1" /> Pending</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Confirmed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>;
    }
  };

  // Get transaction amount with sign
  const getTransactionAmount = () => {
    const prefix = transaction.type === 'send' || transaction.type === 'sell' ? '-' : '+';
    return `${prefix}${transaction.amount} ${transaction.token}`;
  };

  // Get transaction type in readable format
  const getTransactionType = () => {
    switch (transaction.type) {
      case 'send':
        return 'Sent';
      case 'receive':
        return 'Received';
      case 'buy':
        return 'Bought';
      case 'sell':
        return 'Sold';
      case 'swap':
        return 'Swapped';
    }
  };

  // Get transaction color based on type
  const getTransactionColor = () => {
    switch (transaction.type) {
      case 'send':
      case 'sell':
        return 'text-red-600';
      case 'receive':
      case 'buy':
        return 'text-green-600';
      case 'swap':
        return 'text-purple-600';
      default:
        return 'text-gray-700';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm ${className}`}
    >
      {/* Transaction Header */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-between"
        onClick={handleCardClick}
      >
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            {getTransactionIcon()}
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium dark:text-white">
                {getTransactionType()} {transaction.token}
              </h3>
              <div className="ml-2">
                {getStatusBadge()}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(transaction.timestamp)}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`font-medium mr-2 ${getTransactionColor()}`}>
            {getTransactionAmount()}
          </span>
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Transaction Details */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-gray-500 dark:text-gray-400">Status:</div>
            <div className="font-medium dark:text-gray-200">
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              {transaction.confirmations && transaction.confirmations > 0 && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  ({transaction.confirmations} confirmations)
                </span>
              )}
            </div>

            {transaction.address && (
              <>
                <div className="text-gray-500 dark:text-gray-400">
                  {transaction.type === 'send' ? 'To:' : 'From:'}
                </div>
                <div className="font-mono text-xs break-all dark:text-gray-200">
                  {formatAddress(transaction.address)}
                </div>
              </>
            )}

            {transaction.fee && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Network Fee:</div>
                <div className="dark:text-gray-200">{transaction.fee}</div>
              </>
            )}

            {transaction.blockNumber && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Block:</div>
                <div className="dark:text-gray-200">{transaction.blockNumber}</div>
              </>
            )}

            {transaction.txHash && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Transaction:</div>
                <div className="font-mono text-xs break-all">
                  <a
                    href={`https://basescan.org/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                  >
                    {formatAddress(transaction.txHash)}
                    <ExternalLink size={12} className="ml-1" />
                  </a>
                </div>
              </>
            )}

            {transaction.memo && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Memo:</div>
                <div className="dark:text-gray-200">{transaction.memo}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}