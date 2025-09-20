'use client';

import React, { createContext, useContext, useState, ReactNode, Fragment } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'full';
  preventClose?: boolean;
  contentComponent?: React.ReactNode;
}

interface DialogContextType {
  open: <T = unknown>(options: DialogOptions) => Promise<T | boolean>;
  close: (value?: unknown) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: unknown) => void) | null>(null);

  const open = <T = unknown>(options: DialogOptions): Promise<T | boolean> => {
    setOptions(options);
    setIsOpen(true);
    
    return new Promise<T | boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const close = (value: unknown = false) => {
    if (options?.preventClose) return;
    
    setIsOpen(false);
    
    if (resolveRef) {
      resolveRef(value);
      setResolveRef(null);
    }
    
    // Reset dialog options after closing animation
    setTimeout(() => setOptions(null), 200);
  };

  return (
    <DialogContext.Provider value={{ open, close }}>
      {children}
      {isOpen && options && typeof document !== 'undefined' && 
        createPortal(<DialogComponent options={options} onClose={close} />, document.body)}
    </DialogContext.Provider>
  );
};

interface DialogComponentProps {
  options: DialogOptions;
  onClose: (value: unknown) => void;
}

const DialogComponent: React.FC<DialogComponentProps> = ({ options, onClose }) => {
  const {
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'info',
    size = 'md',
    preventClose = false,
    contentComponent,
  } = options;

  const variantClasses = {
    danger: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
  };

  const variantButtonClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !preventClose) {
      onClose(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl border-2 ${variantClasses[variant]} animate-slide-up overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-medium">{title}</h3>
          {!preventClose && (
            <button 
              onClick={() => onClose(false)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="p-4">
          {description && <p className="text-gray-700 mb-4">{description}</p>}
          {contentComponent && <div className="mb-4">{contentComponent}</div>}
          
          <div className="flex justify-end gap-2 mt-4">
            {cancelLabel && !preventClose && (
              <button
                onClick={() => onClose(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={() => onClose(true)}
              className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantButtonClasses[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

// Utility method with convenience functions for common dialog types
export const useDialogUtils = () => {
  const { open } = useDialog();
  
  return {
    alert: (message: string, title = 'Alert') => 
      open({ 
        title, 
        description: message, 
        confirmLabel: 'OK', 
        cancelLabel: '', 
        variant: 'info' 
      }),
    
    confirm: (message: string, title = 'Confirm') => 
      open({ 
        title, 
        description: message, 
        confirmLabel: 'Yes', 
        cancelLabel: 'No', 
        variant: 'warning' 
      }),
    
    prompt: <T = unknown>(content: React.ReactNode, title = 'Input Required') => 
      open<T>({ 
        title, 
        contentComponent: content,
        confirmLabel: 'Submit',
        variant: 'info'
      }),
      
    custom: <T = unknown>(options: DialogOptions) => 
      open<T>(options),
  };
};