'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Smartphone, ZoomIn, RotateCcw, Hand } from 'lucide-react';

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);

    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

export default function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showOptimizeHint, setShowOptimizeHint] = useState(false);
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(userAgent);
      setIsMobile(mobile || window.innerWidth < 768);
      
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape && mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Show optimize hint after a delay
    if (!localStorage.getItem('optimizeHintShown')) {
      const timer = setTimeout(() => {
        setShowOptimizeHint(true);
        localStorage.setItem('optimizeHintShown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Show gesture hint after user interaction
  useEffect(() => {
    if (isMobile && hasInteracted && !localStorage.getItem('gestureHintShown')) {
      const timer = setTimeout(() => {
        setShowGestureHint(true);
        localStorage.setItem('gestureHintShown', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, hasInteracted]);
  
  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true);
    document.addEventListener('click', handleInteraction, { once: true });
    return () => document.removeEventListener('click', handleInteraction);
  }, []);
  
  // Apply mobile-specific styles
  const mobileStyles = isMobile ? 'text-base leading-normal' : '';
  
  return (
    <div 
      className={`mobile-optimized-container ${mobileStyles}`}
      onTouchStart={() => setHasInteracted(true)}
    >
      {/* Landscape warning */}
      <AnimatePresence>
        {isLandscape && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm flex flex-col items-center gap-6 shadow-2xl">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <RotateCcw size={48} className="text-yellow-600 dark:text-yellow-500" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Please Rotate Device</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  For the best experience with the CryptoChap bot, please use your device in portrait orientation.
                </p>
              </div>
              
              <div className="animate-bounce">
                <Smartphone className="transform rotate-90 text-gray-400" size={32} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile optimization hint */}
      <AnimatePresence>
        {showOptimizeHint && isMobile && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 inset-x-0 z-40 px-4 flex justify-center pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 max-w-xs pointer-events-auto">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
                <ZoomIn size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-white text-sm">Mobile Optimized!</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  CryptoChap is fully optimized for your mobile device
                </p>
              </div>
              <button 
                onClick={() => setShowOptimizeHint(false)} 
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Gesture hint */}
      <AnimatePresence>
        {showGestureHint && isMobile && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-16 inset-x-0 z-40 px-4 flex justify-center pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 max-w-xs pointer-events-auto">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full flex-shrink-0">
                <Hand size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-white text-sm">Try Gestures</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Swipe left/right to navigate menus and commands
                </p>
              </div>
              <button 
                onClick={() => setShowGestureHint(false)} 
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Back to top button (mobile only) */}
      {isMobile && (
        <AnimatePresence>
          {hasInteracted && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.9 }}
              className="fixed bottom-24 right-20 z-30 w-10 h-10 bg-gray-800/80 dark:bg-gray-700/80 backdrop-blur-sm
                rounded-full flex items-center justify-center text-white shadow-lg
                border border-white/10"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ArrowUp size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      )}
      
      {/* Apply touch-specific optimizations */}
      <div className={`
        ${isMobile ? 'touch-manipulation' : ''} 
        ${isMobile ? 'overscroll-none' : ''}
      `}>
        {children}
      </div>
      
      {/* iOS safe area handling for notches and home indicators */}
      {isMobile && (
        <style jsx global>{`
          body {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          .mobile-optimized-container {
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
      )}
    </div>
  );
}

// Mobile-optimized touch gestures
export function useTouchGestures(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diffX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}