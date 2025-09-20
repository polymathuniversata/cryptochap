'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export default function Toast({
  id,
  type = 'info',
  message,
  duration = 5000,
  onClose,
  position = 'bottom-center'
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  // Close toast after duration
  useEffect(() => {
    if (duration === Infinity) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    // Update progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 100);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration]);
  
  // Handle closing animation
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose(id);
    }
  };
  
  // Get toast style and icon based on type
  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
          border: 'border-green-200 dark:border-green-800/50',
          icon: <CheckCircle size={20} className="text-green-500 dark:text-green-400" />,
          progressColor: 'bg-green-500 dark:bg-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
          border: 'border-yellow-200 dark:border-yellow-800/50',
          icon: <AlertTriangle size={20} className="text-yellow-500 dark:text-yellow-400" />,
          progressColor: 'bg-yellow-500 dark:bg-yellow-400'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30',
          border: 'border-red-200 dark:border-red-800/50',
          icon: <AlertCircle size={20} className="text-red-500 dark:text-red-400" />,
          progressColor: 'bg-red-500 dark:bg-red-400'
        };
      default: // info
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
          border: 'border-blue-200 dark:border-blue-800/50',
          icon: <Info size={20} className="text-blue-500 dark:text-blue-400" />,
          progressColor: 'bg-blue-500 dark:bg-blue-400'
        };
    }
  };
  
  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default: // bottom-center
        return 'bottom-4 left-1/2 -translate-x-1/2';
    }
  };
  
  const { bg, border, icon, progressColor } = getToastStyle();
  const positionClasses = getPositionClasses();
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 ${positionClasses} max-w-md`}
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          onAnimationComplete={handleAnimationComplete}
        >
          <div
            className={`${bg} ${border} border shadow-lg rounded-lg flex items-center p-4 backdrop-blur-sm`}
          >
            <div className="flex-shrink-0 mr-3">
              {icon}
            </div>
            <div className="flex-1 mr-4">
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {message}
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
            
            {/* Progress bar */}
            {duration !== Infinity && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
                <motion.div
                  className={`h-full ${progressColor}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onClose'> & { position?: ToastProps['position'] }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          position={toast.position}
          onClose={onClose}
        />
      ))}
    </>
  );
}