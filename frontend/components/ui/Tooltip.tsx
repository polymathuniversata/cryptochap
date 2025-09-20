'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  maxWidth?: string;
  interactive?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
  className = '',
  maxWidth = 'max-w-xs',
  interactive = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setIsMounted(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    
    // Wait for fade-out animation to complete before unmounting
    timeoutRef.current = setTimeout(() => {
      setIsMounted(false);
    }, 200);
  };

  // Handle position calculation and adjust if tooltip would be off-screen
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !targetRef.current) return;
    
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const targetRect = targetRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if tooltip is out of bounds and adjust position if needed
    if (position === 'top' && targetRect.top < tooltipRect.height) {
      tooltipRef.current.style.top = 'calc(100% + 5px)';
      tooltipRef.current.style.bottom = 'auto';
    } else if (position === 'bottom' && targetRect.bottom + tooltipRect.height > viewportHeight) {
      tooltipRef.current.style.bottom = 'calc(100% + 5px)';
      tooltipRef.current.style.top = 'auto';
    } else if (position === 'left' && targetRect.left < tooltipRect.width) {
      tooltipRef.current.style.left = '0';
      tooltipRef.current.style.right = 'auto';
    } else if (position === 'right' && targetRect.right + tooltipRect.width > viewportWidth) {
      tooltipRef.current.style.right = '0';
      tooltipRef.current.style.left = 'auto';
    }
  }, [isVisible, position]);

  // Base position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  // Position-specific arrow classes
  const arrowClasses = {
    top: 'bottom-0 left-1/2 transform translate-x-[-50%] translate-y-[100%] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 transform translate-x-[-50%] translate-y-[-100%] border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-0 top-1/2 transform translate-x-[100%] translate-y-[-50%] border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-0 top-1/2 transform translate-x-[-100%] translate-y-[-50%] border-t-transparent border-b-transparent border-l-transparent',
  };

  const handleMouseEvents = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  };

  // For interactive tooltips (like ones with links)
  const interactiveProps = interactive 
    ? { 
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: hideTooltip
      } 
    : {};

  return (
    <span className="relative inline-block" ref={targetRef} {...handleMouseEvents}>
      {children}
      
      {isMounted && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-md
            ${positionClasses[position]} 
            ${maxWidth}
            ${isVisible ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
            ${className}
          `}
          {...interactiveProps}
          role="tooltip"
        >
          {content}
          <div 
            className={`absolute w-0 h-0 border-4 border-solid border-gray-900 ${arrowClasses[position]}`}
            aria-hidden="true"
          />
        </div>
      )}
    </span>
  );
};

// Simpler version for common use cases
interface SimpleTooltipProps {
  tip: string;
  children: ReactNode;
  position?: TooltipPosition;
}

export const Tip: React.FC<SimpleTooltipProps> = ({ tip, children, position = 'top' }) => {
  return (
    <Tooltip content={tip} position={position}>
      {children}
    </Tooltip>
  );
};