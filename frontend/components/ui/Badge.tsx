'use client';

import React, { ReactNode } from 'react';

type BadgeVariant = 
  | 'primary' 
  | 'secondary'
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info'
  | 'outline';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  icon,
  className = '',
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium whitespace-nowrap';
  
  // Size-specific classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5',
  };
  
  // Rounded corners classes
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';
  
  // Variant-specific classes
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    outline: 'bg-transparent text-gray-800 border border-gray-300',
  };
  
  const badgeClasses = `${baseClasses} ${sizeClasses[size]} ${roundedClasses} ${variantClasses[variant]} ${className}`.trim();
  
  return (
    <span className={badgeClasses}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

// Specialized variants for easy use
export const SuccessBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="success" {...props} />
);

export const DangerBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="danger" {...props} />
);

export const WarningBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="warning" {...props} />
);

export const InfoBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="info" {...props} />
);

// Status badge component
type StatusType = 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: StatusType;
  showText?: boolean;
  size?: BadgeSize;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showText = true,
  size = 'md',
  className = '',
}) => {
  const statusConfig = {
    online: { bg: 'bg-green-500', text: 'Online' },
    offline: { bg: 'bg-gray-400', text: 'Offline' },
    away: { bg: 'bg-amber-500', text: 'Away' },
    busy: { bg: 'bg-red-500', text: 'Busy' },
    pending: { bg: 'bg-blue-500', text: 'Pending' },
    approved: { bg: 'bg-green-500', text: 'Approved' },
    rejected: { bg: 'bg-red-500', text: 'Rejected' },
  };
  
  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: { dot: 'w-1.5 h-1.5', text: 'text-xs' },
    md: { dot: 'w-2 h-2', text: 'text-xs' },
    lg: { dot: 'w-2.5 h-2.5', text: 'text-sm' },
  };
  
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className={`${sizeClasses[size].dot} ${config.bg} rounded-full`}></span>
      {showText && (
        <span className={`ml-1.5 ${sizeClasses[size].text} text-gray-700`}>
          {config.text}
        </span>
      )}
    </span>
  );
};