'use client';

import React, { ReactNode } from 'react';
import { ToastProvider } from './Toast';
import { DialogProvider } from './Dialog';
import ThemeProvider from './ThemeProvider';

interface UIProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export const UIProvider: React.FC<UIProviderProps> = ({ 
  children, 
  defaultTheme = 'light'
}) => {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>
        <DialogProvider>
          {children}
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};