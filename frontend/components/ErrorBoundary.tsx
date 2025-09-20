'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
            We encountered an error while rendering this component. Try refreshing to fix the issue.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4 max-w-md overflow-x-auto text-left">
            <pre>{this.state.error?.toString()}</pre>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}