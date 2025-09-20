'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>): string => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const { id, message, type, duration = 5000, action } = toast;

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getClasses = () => {
    const baseClasses = 'flex items-start p-3 rounded-lg shadow-lg border relative transform transition-all duration-300 ease-in-out';
    
    const typeClasses = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    return `${baseClasses} ${typeClasses[type]} animate-slide-in-right`;
  };

  return (
    <div className={getClasses()}>
      <div className="mr-2 mt-0.5">{getIcon()}</div>
      <div className="flex-1 pr-8">
        <div className="text-sm font-medium">{message}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-1 text-xs font-medium hover:underline focus:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Close toast"
      >
        <X size={16} />
      </button>

      {/* Progress bar - using duration classes for common values, custom property for dynamic */}
      <div 
        className={`absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-progress ${
          duration === 3000 ? 'duration-3000' :
          duration === 4000 ? 'duration-4000' :
          duration === 5000 ? 'duration-5000' :
          duration === 6000 ? 'duration-6000' :
          duration === 7000 ? 'duration-7000' : ''
        }`} 
        data-toast-duration
        style={duration && ![3000, 4000, 5000, 6000, 7000].includes(duration) ? { '--toast-duration': `${duration}ms` } as React.CSSProperties : undefined} 
      />
    </div>
  );
};

// Utility hook with toast methods
export const useToastUtils = () => {
  const { addToast } = useToast();
  
  return {
    toast: (message: string, type: ToastType = 'info', duration: number = 5000) => 
      addToast({ message, type, duration }),
    success: (message: string, duration?: number) => 
      addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => 
      addToast({ message, type: 'error', duration }),
    warning: (message: string, duration?: number) => 
      addToast({ message, type: 'warning', duration }),
    info: (message: string, duration?: number) => 
      addToast({ message, type: 'info', duration })
  };
};