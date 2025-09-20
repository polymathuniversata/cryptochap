'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useRef, 
  useEffect, 
  ReactNode 
} from 'react';
import { ChevronDown } from 'lucide-react';

type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

interface DropdownContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

interface DropdownProps {
  children: ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

interface DropdownTriggerProps {
  children: ReactNode;
  className?: string;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({ children, className = '' }) => {
  const context = useContext(DropdownContext);
  
  if (!context) {
    throw new Error('DropdownTrigger must be used within a Dropdown');
  }
  
  const { toggle } = context;

  return (
    <div 
      onClick={toggle} 
      className={`cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
};

interface DropdownMenuProps {
  children: ReactNode;
  position?: DropdownPosition;
  className?: string;
  width?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  position = 'bottom-left',
  className = '',
  width = 'w-48',
}) => {
  const context = useContext(DropdownContext);
  
  if (!context) {
    throw new Error('DropdownMenu must be used within a Dropdown');
  }
  
  const { isOpen } = context;

  if (!isOpen) return null;

  const positionClasses = {
    'bottom-left': 'top-full left-0',
    'bottom-right': 'top-full right-0',
    'top-left': 'bottom-full left-0',
    'top-right': 'bottom-full right-0',
  };

  return (
    <div 
      className={`absolute z-30 mt-1 ${width} rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${positionClasses[position]} animate-fade-in-down ${className}`}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  onClick,
  className = '',
  disabled = false,
}) => {
  const context = useContext(DropdownContext);
  
  if (!context) {
    throw new Error('DropdownItem must be used within a Dropdown');
  }
  
  const { close } = context;

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick();
    close();
  };

  return (
    <div
      onClick={handleClick}
      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

interface DropdownDividerProps {
  className?: string;
}

export const DropdownDivider: React.FC<DropdownDividerProps> = ({ className = '' }) => {
  return (
    <div className={`my-1 border-t border-gray-200 ${className}`} />
  );
};

// Common Dropdown Button component
interface DropdownButtonProps {
  label: string;
  icon?: React.ReactNode;
  children: ReactNode;
  buttonClassName?: string;
  menuClassName?: string;
  position?: DropdownPosition;
  dropdownWidth?: string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  icon,
  children,
  buttonClassName = '',
  menuClassName = '',
  position = 'bottom-left',
  dropdownWidth = 'w-48',
}) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button 
          className={`flex items-center justify-between px-4 py-2 border rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 ${buttonClassName}`}
        >
          <span className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </span>
          <ChevronDown size={16} className="ml-2" />
        </button>
      </DropdownTrigger>
      <DropdownMenu 
        position={position} 
        className={menuClassName}
        width={dropdownWidth}
      >
        {children}
      </DropdownMenu>
    </Dropdown>
  );
};