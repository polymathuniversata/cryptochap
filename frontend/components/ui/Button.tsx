'use client';

import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { LoadingIndicator } from './animations/LoadingStates';
import { Tooltip } from './Tooltip';

type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'link' 
  | 'danger' 
  | 'success' 
  | 'warning';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      leftIcon,
      rightIcon,
      tooltip,
      tooltipPosition = 'top',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes applied to all buttons
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Size-specific classes
    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 rounded',
      md: 'text-sm px-4 py-2 rounded-md',
      lg: 'text-base px-6 py-3 rounded-md',
      icon: 'p-2 rounded-full',
    };
    
    // Variant-specific classes
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      link: 'bg-transparent text-blue-600 hover:underline p-0 shadow-none focus:ring-0',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
      warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700',
    };
    
    // Width class
    const widthClass = isFullWidth ? 'w-full' : '';
    
    // Combine classes
    const buttonClasses = `
      ${baseClasses} 
      ${sizeClasses[size]} 
      ${variantClasses[variant]}
      ${widthClass}
      ${className}
    `.trim();
    
    // Button content
    const buttonContent = (
      <>
        {isLoading && (
          <span className="mr-2">
            <LoadingIndicator size="small" type="spinner" />
          </span>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {size === 'icon' ? <span className="sr-only">{children}</span> : children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    );
    
    const button = (
      <button
        className={buttonClasses}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {buttonContent}
      </button>
    );
    
    // If tooltip is provided, wrap button in Tooltip
    if (tooltip && !disabled) {
      return (
        <Tooltip content={tooltip} position={tooltipPosition}>
          {button}
        </Tooltip>
      );
    }
    
    return button;
  }
);

Button.displayName = 'Button';

// Specialized button variants for common use cases
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button variant="primary" ref={ref} {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button variant="secondary" ref={ref} {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const OutlineButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button variant="outline" ref={ref} {...props} />
));
OutlineButton.displayName = 'OutlineButton';

export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'> & { size?: 'sm' | 'md' | 'lg' }>((
  { size = 'md', ...props }, 
  ref
) => {
  const iconSizeMap = {
    sm: 'size-icon',
    md: 'size-icon', 
    lg: 'size-icon'
  };
  
  return <Button size="icon" ref={ref} className={iconSizeMap[size]} {...props} />;
});
IconButton.displayName = 'IconButton';

export const LinkButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button variant="link" ref={ref} {...props} />
));
LinkButton.displayName = 'LinkButton';

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button variant="danger" ref={ref} {...props} />
));
DangerButton.displayName = 'DangerButton';