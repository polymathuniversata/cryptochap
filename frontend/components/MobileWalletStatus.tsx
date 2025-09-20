'use client';

import { useState, useRef, useEffect } from 'react';
import { Wallet, X, Copy, ExternalLink, RefreshCw, Eye, EyeOff, QrCode, ArrowDownToLine, CreditCard, BarChart3 } from 'lucide-react';
// @ts-ignore - Temporary fix for Framer Motion v12 typing issues
import { motion, AnimatePresence } from 'framer-motion';

const MotionButton = motion.button as any;
const MotionDiv = motion.div as any;
const MotionA = motion.a as any;

interface MobileWalletStatusProps {
  address: string;
  usdcBalance: string;
  ethBalance: string;
  isConnected: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function MobileWalletStatus({
  address,
  usdcBalance,
  ethBalance,
  isConnected,
  onRefresh,
  isRefreshing = false
}: MobileWalletStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'Not connected';
    if (showFullAddress) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  // Close modal when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  return (
    <>
      {/* Floating Action Button */}
      <MotionButton
        onClick={() => setIsExpanded(true)}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-20 right-4 w-16 h-16 bg-gradient-to-br from-whatsapp-green to-blue-600 
          text-white rounded-full wallet-button-shadow flex items-center justify-center z-50
          transition-all duration-300 hover:shadow-lg hover:shadow-whatsapp-green/20"
      >
        <div className="absolute inset-0 bg-white rounded-full opacity-10 animate-ping-slow"></div>
        <Wallet size={22} />
        <div className="absolute top-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center 
          text-[9px] text-whatsapp-green font-bold border-2 border-whatsapp-green shadow-sm">
          ${usdcBalance.slice(0, 1)}
        </div>
      </MotionButton>

      {/* Mobile Wallet Modal */}
      <AnimatePresence>
        {isExpanded && (
          <MotionDiv 
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MotionDiv 
              ref={modalRef}
              className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white
                rounded-t-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Handle Bar */}
              <div className="flex justify-center p-2 sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900 backdrop-blur-md">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="relative">
                {/* Background */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-whatsapp-green/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4"></div>
                </div>
                
                <div className="flex items-center justify-between p-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-whatsapp-green to-blue-600 dark:from-whatsapp-green-dark dark:to-blue-800
                      rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                      <Wallet size={28} className="text-white drop-shadow-md" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Crypto Wallet</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-sm ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isConnected ? 'Connected to Base' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <MotionButton
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(false)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
                      rounded-full transition-colors duration-200"
                  >
                    <X size={20} />
                  </MotionButton>
                </div>
              </div>

              {/* Wallet Content */}
              <div className="p-6 space-y-6">
                {/* Network Badge */}
                <div className="flex justify-center -mt-3 mb-4">
                  <div className="bg-gradient-to-r from-crypto-base/30 to-crypto-base/40 backdrop-blur-sm
                    px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 
                    text-gray-700 dark:text-white/90 border border-crypto-base/20 shadow-sm">
                    <div className="w-2.5 h-2.5 bg-crypto-base rounded-full"></div>
                    Base Network
                    <span className="bg-white/20 dark:bg-black/20 text-xs px-2 py-0.5 rounded-md">
                      Optimistic L2
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-whatsapp-green/5 to-blue-400/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <div className="text-sm font-medium">Your Base Address</div>
                      </div>
                      <MotionButton
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowFullAddress(!showFullAddress)}
                        className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
                      >
                        {showFullAddress ? <EyeOff size={14} /> : <Eye size={14} />}
                      </MotionButton>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 font-mono text-sm border border-gray-100 dark:border-gray-600 flex justify-between items-center group relative">
                      <AnimatePresence>
                        {copyFeedback && (
                          <MotionDiv 
                            className="absolute inset-0 bg-green-500 flex items-center justify-center text-white font-medium rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            Copied to clipboard!
                          </MotionDiv>
                        )}
                      </AnimatePresence>
                      <span className="text-gray-800 dark:text-gray-200 select-all truncate">
                        {formatAddress(address)}
                      </span>
                      <div className="flex items-center gap-1">
                        <MotionButton
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCopyAddress}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-500 dark:text-gray-400"
                        >
                          <Copy size={14} />
                        </MotionButton>
                        <MotionA
                          whileTap={{ scale: 0.9 }}
                          href={`https://basescan.org/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-blue-500"
                        >
                          <ExternalLink size={14} />
                        </MotionA>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <MotionButton
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                          rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                      >
                        <QrCode size={12} />
                        Show QR Code
                      </MotionButton>
                    </div>
                  </div>
                </div>

                {/* Balances */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">Your Balances</h4>
                    <MotionButton
                      whileTap={{ scale: 0.95 }}
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 
                        dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium
                        disabled:opacity-70 transition-colors duration-200 text-gray-700 dark:text-gray-300"
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                      Refresh
                    </MotionButton>
                  </div>
                  
                  <MotionDiv 
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gradient-to-r from-crypto-usdc/20 to-blue-500/20 dark:from-crypto-usdc/10 dark:to-blue-500/10 
                      rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-crypto-usdc/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-crypto-usdc to-blue-500 rounded-full flex items-center justify-center shadow-inner border border-white/20">
                            <span className="text-white font-bold text-lg">$</span>
                          </div>
                          <div>
                            <div className="font-bold text-2xl text-gray-800 dark:text-white">{usdcBalance}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <span className="bg-crypto-usdc/20 text-crypto-usdc dark:text-crypto-usdc/90 px-1.5 py-0.5 rounded text-xs font-semibold">USDC</span>
                              <span>USD Coin</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">≈ ${usdcBalance} USD</div>
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                            <ArrowDownToLine size={12} />
                            +0.00 (24h)
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Available for payments and transfers
                        </div>
                        <div>
                          <BarChart3 size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </MotionDiv>

                  <MotionDiv 
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gradient-to-r from-gray-600/20 to-gray-500/10 dark:from-gray-800/40 dark:to-gray-700/30 
                      rounded-2xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-gray-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-500 rounded-full flex items-center justify-center shadow-inner border border-white/20">
                            <span className="text-white font-bold text-lg">Ξ</span>
                          </div>
                          <div>
                            <div className="font-bold text-2xl text-gray-800 dark:text-white">{ethBalance}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <span className="bg-gray-600/20 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs font-semibold">ETH</span>
                              <span>Ethereum</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Gas for ~50 tx</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Transaction fees</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Used for network transaction fees
                        </div>
                        <div>
                          <BarChart3 size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </MotionDiv>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-white">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MotionButton 
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-br from-whatsapp-green to-whatsapp-green-dark dark:from-whatsapp-green-dark dark:to-whatsapp-green-darker
                        text-white py-4 px-3 rounded-2xl font-medium flex flex-col items-center gap-2 shadow-md
                        hover:shadow-lg hover:shadow-whatsapp-green/20 transition-shadow duration-300"
                    >
                      <ArrowDownToLine size={24} />
                      <span>Receive USDC</span>
                    </MotionButton>
                    <MotionButton 
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900
                        text-white py-4 px-3 rounded-2xl font-medium flex flex-col items-center gap-2 shadow-md
                        hover:shadow-lg hover:shadow-blue-600/20 transition-shadow duration-300"
                    >
                      <CreditCard size={24} />
                      <span>Buy USDC</span>
                    </MotionButton>
                  </div>
                </div>

                {/* Network Info */}
                <MotionDiv 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-br from-crypto-base/80 to-crypto-base dark:from-crypto-base/90 dark:to-crypto-base 
                    text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-grid-white/5"></div>
                  <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/10 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="font-bold text-xl mb-1">Base Network</div>
                    <div className="text-sm text-white/90 mb-4">Ethereum Layer 2 Solution</div>
                    <div className="flex justify-center gap-8 text-center">
                      <div>
                        <div className="text-2xl font-bold">Fast</div>
                        <div className="text-xs text-white/80">Transactions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">Low</div>
                        <div className="text-xs text-white/80">Gas Fees</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">Secure</div>
                        <div className="text-xs text-white/80">Blockchain</div>
                      </div>
                    </div>
                  </div>
                </MotionDiv>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
}