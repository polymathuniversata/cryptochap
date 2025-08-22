'use client';

import { useState } from 'react';
import { Wallet, X, ChevronUp, ChevronDown, Copy, ExternalLink } from 'lucide-react';

interface MobileWalletStatusProps {
  address: string;
  usdcBalance: string;
  ethBalance: string;
  isConnected: boolean;
  onRefresh: () => void;
}

export default function MobileWalletStatus({
  address,
  usdcBalance,
  ethBalance,
  isConnected,
  onRefresh
}: MobileWalletStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-whatsapp-green text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-whatsapp-green-dark transition-colors"
      >
        <Wallet size={20} />
      </button>

      {/* Mobile Wallet Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            {/* Handle Bar */}
            <div className="flex justify-center p-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-whatsapp-green rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Your Wallet</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Wallet Content */}
            <div className="p-4 space-y-4">
              {/* Address */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">Base Network Address</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm flex-1">
                    {formatAddress(address)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={`https://basescan.org/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Balances</h4>
                
                <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-crypto-usdc rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">$</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{usdcBalance}</div>
                      <div className="text-sm text-gray-600">USDC</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">≈ ${usdcBalance}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Ξ</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{ethBalance}</div>
                      <div className="text-sm text-gray-600">ETH (Gas)</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">For transactions</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-whatsapp-green text-white p-3 rounded-xl font-medium">
                    Receive USDC
                  </button>
                  <button className="bg-blue-600 text-white p-3 rounded-xl font-medium">
                    Buy USDC
                  </button>
                </div>
              </div>

              {/* Network Info */}
              <div className="bg-crypto-base text-white rounded-xl p-4 text-center">
                <div className="font-medium">Base Network</div>
                <div className="text-sm text-white/80">Fast • Low Cost • Secure</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}