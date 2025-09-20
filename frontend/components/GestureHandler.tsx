'use client';

import React, { useEffect, useState, useRef } from 'react';

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  disabled?: boolean;
}

export default function GestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  disabled = false
}: GestureHandlerProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const [feedbackIndicator, setFeedbackIndicator] = useState<{
    active: boolean;
    type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'long-press' | 'double-tap';
  } | null>(null);

  // Cleanup function for touch events
  const cleanupTouch = () => {
    startX.current = null;
    startY.current = null;
    startTime.current = null;
    isSwiping.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Show visual feedback for gesture
  const showFeedback = (type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'long-press' | 'double-tap') => {
    setFeedbackIndicator({ active: true, type });
    setTimeout(() => setFeedbackIndicator(null), 300);
  };

  // Touch start handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    isSwiping.current = false;

    // Set long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (startX.current !== null) {  // Check if we haven't moved too much
          showFeedback('long-press');
          onLongPress();
          cleanupTouch();
        }
      }, longPressDelay);
    }
  };

  // Touch move handler
  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || startX.current === null || startY.current === null) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    
    // If moved significantly, cancel long press
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    
    // Only set swiping after we've moved a certain distance to avoid false positives
    if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
      isSwiping.current = true;
    }
  };

  // Touch end handler
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || startX.current === null || startY.current === null || startTime.current === null) {
      cleanupTouch();
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    const deltaTime = Date.now() - startTime.current;

    // Check for double tap
    const currentTime = Date.now();
    if (onDoubleTap && 
        Math.abs(deltaX) < 10 && 
        Math.abs(deltaY) < 10 && 
        deltaTime < 300 && 
        currentTime - lastTapTime.current < doubleTapDelay) {
      showFeedback('double-tap');
      onDoubleTap();
      lastTapTime.current = 0; // Reset to avoid triple-tap triggering another double-tap
    } else {
      lastTapTime.current = currentTime;
      
      // Check for swipe gestures - only if we're actually swiping
      if (isSwiping.current && deltaTime < 300) {  // Fast motion (less than 300ms)
        if (Math.abs(deltaX) > swipeThreshold) {
          if (deltaX > 0 && onSwipeRight) {
            showFeedback('swipe-right');
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            showFeedback('swipe-left');
            onSwipeLeft();
          }
        } else if (Math.abs(deltaY) > swipeThreshold) {
          if (deltaY > 0 && onSwipeDown) {
            showFeedback('swipe-down');
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            showFeedback('swipe-up');
            onSwipeUp();
          }
        }
      }
    }

    cleanupTouch();
  };

  // Cancel touch
  const handleTouchCancel = () => {
    cleanupTouch();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="relative"
    >
      {/* Visual feedback indicator */}
      {feedbackIndicator && (
        <div className={`
          absolute inset-0 z-50 pointer-events-none
          ${feedbackIndicator.type === 'swipe-left' && 'swipe-left-indicator'}
          ${feedbackIndicator.type === 'swipe-right' && 'swipe-right-indicator'}
          ${feedbackIndicator.type === 'swipe-up' && 'swipe-up-indicator'}
          ${feedbackIndicator.type === 'swipe-down' && 'swipe-down-indicator'}
          ${feedbackIndicator.type === 'long-press' && 'long-press-indicator'}
          ${feedbackIndicator.type === 'double-tap' && 'double-tap-indicator'}
        `}>
          <div className="absolute inset-0 flex items-center justify-center">
            {feedbackIndicator.type === 'long-press' && (
              <div className="w-20 h-20 bg-gray-800/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 bg-white rounded-full"></div>
              </div>
            )}
            {feedbackIndicator.type === 'double-tap' && (
              <div className="w-16 h-16 bg-blue-500/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-ping">
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main content */}
      {children}
      
      {/* CSS for gesture indicators */}
      <style jsx>{`
        .swipe-left-indicator {
          background: linear-gradient(to left, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.3));
          animation: swipeLeftAnim 300ms ease-out;
        }
        .swipe-right-indicator {
          background: linear-gradient(to right, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.3));
          animation: swipeRightAnim 300ms ease-out;
        }
        .swipe-up-indicator {
          background: linear-gradient(to top, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.3));
          animation: swipeUpAnim 300ms ease-out;
        }
        .swipe-down-indicator {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.3));
          animation: swipeDownAnim 300ms ease-out;
        }
        
        @keyframes swipeLeftAnim {
          0% { transform: translateX(0); opacity: 0.8; }
          100% { transform: translateX(-100px); opacity: 0; }
        }
        @keyframes swipeRightAnim {
          0% { transform: translateX(0); opacity: 0.8; }
          100% { transform: translateX(100px); opacity: 0; }
        }
        @keyframes swipeUpAnim {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        @keyframes swipeDownAnim {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}