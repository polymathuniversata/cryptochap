'use client';

import { useState } from 'react';
import { Wallet, Eye, EyeOff, Copy, ExternalLink, RefreshCw } from 'lucide-react';

interface WalletStatusProps {
  address: string;
  usdcBalance: string;
  ethBalance: string;
  isConnected: boolean;
  onRefresh: () => void;
}

export default function WalletStatus({
  address,
  usdcBalance,
  ethBalance,
  isConnected,
  onRefresh
}: WalletStatusProps) {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatAddress = (addr: string) => {
    return showFullAddress ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-gradient-to-br from-whatsapp-green-dark via-whatsapp-green to-blue-600 dark:from-gray-800 dark:via-whatsapp-green-dark dark:to-blue-900 text-white p-5 mx-5 my-4 rounded-2xl shadow-lg border border-whatsapp-green-light/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-300 rounded-full blur-3xl transform -translate-x-40 translate-y-20"></div>
        <svg className="absolute top-0 left-0 w-full h-full opacity-5" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner transform transition-transform hover:scale-105">
            <Wallet size={20} className="drop-shadow" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Your Crypto Wallet</span>
            {isConnected && (
              <div className="text-xs flex items-center mt-0.5 text-green-100">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1.5"></span>
                Active on Base
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white/20 hover:bg-white/30 active:bg-white/10 backdrop-blur-md rounded-full transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            title="Refresh wallet balance"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          
          <div className={`flex items-center gap-1.5 py-1 px-2 rounded-full ${
            isConnected 
              ? 'bg-green-500/20 text-green-100' 
              : 'bg-red-500/20 text-red-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-xs font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-5 relative z-10">
        <div className="text-xs font-medium text-white/80 mb-1.5 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
          Wallet Address
        </div>
        <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-lg p-3 transition-all group border border-white/10 shadow-inner">
          <span className="font-mono text-sm flex-1 tracking-wider">
            {formatAddress(address)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFullAddress(!showFullAddress)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              title={showFullAddress ? 'Hide address' : 'Show full address'}
            >
              {showFullAddress ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={handleCopyAddress}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors group-hover:opacity-100 opacity-70"
              title="Copy address"
            >
              <Copy size={14} />
            </button>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-blue-200 group-hover:opacity-100 opacity-70"
              title="View on BaseScan"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-4 transition-all group border border-white/10 shadow-md transform hover:scale-102 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/80">USDC Balance</div>
            <div className="bg-crypto-usdc/20 text-xs font-bold text-white px-2 py-0.5 rounded">USDC</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-crypto-usdc to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
              $
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">{usdcBalance}</span>
              <div className="text-xs text-white/70">~${usdcBalance} USD</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-4 transition-all group border border-white/10 shadow-md transform hover:scale-102 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/80">ETH (Gas)</div>
            <div className="bg-gray-600/20 text-xs font-bold text-white px-2 py-0.5 rounded">ETH</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
              Ξ
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">{ethBalance}</span>
              <div className="text-xs text-white/70">Gas for ~50 tx</div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Badge */}
      <div className="mt-5 flex justify-center relative z-10">
        <div className="bg-crypto-base/30 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-white/10 shadow-md">
          <div className="w-3 h-3 bg-crypto-base rounded-full"></div>
          Base Network
          <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-md">Optimistic L2</span>
        </div>
      </div>
    </div>
  );
}