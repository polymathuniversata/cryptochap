'use client';

import { useRef, useEffect } from 'react';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface UseGesturesOptions {
  threshold?: number;  // Minimum distance for swipe detection
  longPressDelay?: number;  // Time in ms for long press
  doubleTapDelay?: number;  // Time in ms between taps for double tap
}

export function useGestures(
  ref: React.RefObject<HTMLElement>,
  handlers: GestureHandlers,
  options: UseGesturesOptions = {}
) {
  const {
    threshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300
  } = options;

  // State for tracking gestures
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Set up long press timer
      if (handlers.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          handlers.onLongPress?.();
          touchStartRef.current = null; // Prevent other gestures
        }, longPressDelay);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press on movement
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const touchStart = touchStartRef.current;
      if (!touchStart) return;

      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStart.x;
      const deltaY = touchEnd.clientY - touchStart.y;
      const timeElapsed = Date.now() - touchStart.time;

      // Check for swipe gestures
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (Math.max(absX, absY) > threshold) {
        // Determine swipe direction
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      } else if (timeElapsed < 300 && absX < 10 && absY < 10) {
        // Tap or double tap detection
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTimeRef.current;

        if (handlers.onDoubleTap && timeSinceLastTap < doubleTapDelay) {
          handlers.onDoubleTap();
          lastTapTimeRef.current = 0; // Reset to prevent triple-tap triggering another double-tap
        } else {
          lastTapTimeRef.current = now;
          
          // Use setTimeout to differentiate single tap from double tap
          if (handlers.onTap) {
            setTimeout(() => {
              const timeSinceLastTap = Date.now() - lastTapTimeRef.current;
              if (timeSinceLastTap >= doubleTapDelay) {
                handlers.onTap?.();
              }
            }, doubleTapDelay + 10);
          }
        }
      }

      touchStartRef.current = null;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handlers, threshold, longPressDelay, doubleTapDelay, ref]);
}

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  threshold = 50,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGestures(
    containerRef,
    {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onTap,
      onDoubleTap,
      onLongPress
    },
    { threshold }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};