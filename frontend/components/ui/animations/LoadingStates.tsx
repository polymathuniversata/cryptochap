'use client';

import { FC } from 'react';

// Types of loading animations
export type LoadingType = 'spinner' | 'pulse' | 'dots' | 'skeleton' | 'progress';

interface LoadingProps {
  type?: LoadingType;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  className?: string;
  progress?: number; // For progress type (0-100)
}

export const LoadingIndicator: FC<LoadingProps> = ({ 
  type = 'spinner',
  size = 'medium',
  color = 'text-whatsapp-green',
  text,
  className = '',
  progress = 0
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const renderLoadingIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className={`${sizeClasses[size]} ${color} animate-spin rounded-full border-2 border-b-transparent ${className}`}></div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} ${color} animate-pulse rounded-full ${className}`}></div>
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={`${color} rounded-full animate-bounce ${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} ${className} animation-delay-0`}></div>
            <div className={`${color} rounded-full animate-bounce ${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} ${className} animation-delay-150`}></div>
            <div className={`${color} rounded-full animate-bounce ${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} ${className} animation-delay-300`}></div>
          </div>
        );
      
      case 'skeleton':
        return (
          <div className={`animate-pulse bg-gray-200 rounded ${className} ${size === 'small' ? 'skeleton-small' : size === 'medium' ? 'skeleton-medium' : 'skeleton-large'}`}></div>
        );
      
      case 'progress':
        return (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full progress-dynamic ${color}`}
              data-progress-width
              style={{ '--progress-width': `${progress}%` } as React.CSSProperties}
            ></div>
          </div>
        );
      
      default:
        return <div className={`${sizeClasses[size]} ${color} animate-spin rounded-full border-2 border-b-transparent ${className}`}></div>;
    }
  };

  return (
    <div className="flex items-center justify-center">
      {renderLoadingIndicator()}
      {text && <span className={`ml-2 text-sm ${color}`}>{text}</span>}
    </div>
  );
};

// Skeleton loader for content
interface SkeletonProps {
  lines?: number;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  className?: string;
}

export const SkeletonLoader: FC<SkeletonProps> = ({ 
  lines = 1,
  width = '100%',
  height = '20px',
  rounded = true,
  className = ''
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`bg-gray-200 mb-2 animate-pulse skeleton-width-dynamic ${rounded ? 'rounded' : ''}`}
          data-skeleton-width
          data-skeleton-height
          style={{ 
            '--skeleton-width': typeof width === 'number' ? `${width}px` : width,
            '--skeleton-height': typeof height === 'number' ? `${height}px` : height
          } as React.CSSProperties}
        ></div>
      ))}
    </div>
  );
};

// Transaction loading state
interface TransactionLoadingProps {
  stage: 'preparing' | 'signing' | 'broadcasting' | 'confirming';
  progress?: number;
}

export const TransactionLoading: FC<TransactionLoadingProps> = ({ 
  stage = 'preparing',
  progress = 0
}) => {
  const stages = ['preparing', 'signing', 'broadcasting', 'confirming'];
  const currentStageIndex = stages.indexOf(stage);
  
  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'upcoming';
  };
  
  return (
    <div className="w-full py-4">
      <div className="flex justify-between mb-2">
        {stages.map((stageName, index) => (
          <div key={stageName} className="flex flex-col items-center">
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${getStageStatus(index) === 'completed' ? 'bg-green-500 text-white' : 
                  getStageStatus(index) === 'current' ? 'bg-whatsapp-green text-white animate-pulse' :
                  'bg-gray-200 text-gray-400'}`}
            >
              {getStageStatus(index) === 'completed' ? '✓' : index + 1}
            </div>
            <div className="text-xs mt-1 text-center capitalize">
              {stageName}
            </div>
          </div>
        ))}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div 
          className="h-1.5 rounded-full bg-whatsapp-green progress-dynamic"
          data-progress-width
          style={{ 
            '--progress-width': `${progress || (currentStageIndex / (stages.length - 1)) * 100}%`
          } as React.CSSProperties}
        ></div>
      </div>
    </div>
  );
};