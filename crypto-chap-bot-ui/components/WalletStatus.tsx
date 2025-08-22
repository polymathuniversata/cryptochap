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
    <div className="bg-gradient-to-r from-whatsapp-green to-whatsapp-green-dark text-white p-4 m-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet size={16} />
          </div>
          <span className="font-medium">Your Wallet</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-4">
        <div className="text-xs text-white/70 mb-1">Base Network Address</div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
          <span className="font-mono text-sm flex-1">
            {formatAddress(address)}
          </span>
          <button
            onClick={() => setShowFullAddress(!showFullAddress)}
            className="p-1 hover:bg-white/10 rounded"
          >
            {showFullAddress ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={handleCopyAddress}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Copy size={14} />
          </button>
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-white/10 rounded"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-white/70 mb-1">USDC</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-crypto-usdc rounded-full flex items-center justify-center text-white font-bold text-xs">
              $
            </div>
            <span className="font-semibold">{usdcBalance}</span>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-white/70 mb-1">ETH (Gas)</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              Ξ
            </div>
            <span className="font-semibold">{ethBalance}</span>
          </div>
        </div>
      </div>

      {/* Network Badge */}
      <div className="mt-3 flex justify-center">
        <div className="bg-crypto-base px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Base Network
        </div>
      </div>
    </div>
  );
}