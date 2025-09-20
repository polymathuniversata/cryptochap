'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined });
    
    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 flex flex-col items-center justify-center min-h-[120px]">
          <div className="flex items-center mb-3">
            <AlertTriangle className="mr-2" size={20} />
            <h3 className="font-medium">Something went wrong</h3>
          </div>
          
          <p className="text-sm mb-4 text-center">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          
          <button
            onClick={this.resetError}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} className="mr-1.5" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error message component
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  className = '' 
}) => {
  return (
    <div className={`p-2 rounded border border-red-200 bg-red-50 text-red-600 text-sm ${className}`}>
      <div className="flex items-center">
        <AlertTriangle size={14} className="mr-1.5 flex-shrink-0" />
        <span>{message}</span>
      </div>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="ml-1 underline text-red-700 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
};