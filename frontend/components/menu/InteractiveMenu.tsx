'use client';

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMenu } from '../../lib/menu/MenuContext';
import MenuCard from './MenuCard';
import MenuBreadcrumbs from './MenuBreadcrumbs';
import { useTouchGestures } from '../MobileOptimizations';

export default function InteractiveMenu() {
  const { 
    currentMenu, 
    currentMenuId,
    navigateToMenu, 
    navigateBack,
    executeCommand,
    isMenuVisible,
    hideMenu
  } = useMenu();
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Set up swipe gesture to close menu
  useTouchGestures(
    () => hideMenu(),
    undefined
  );

  // Clicking outside menu closes it
  useEffect(() => {
    if (!isMenuVisible) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuVisible, hideMenu]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideMenu();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [hideMenu]);

  if (!isMenuVisible) {
    return null;
  }

  const handleItemSelect = (item: any) => {
    switch (item.action) {
      case 'submenu':
        navigateToMenu(item.id, item.label);
        break;
        
      case 'command':
        if (item.command) {
          executeCommand(item.command);
        }
        break;
        
      case 'link':
        if (item.url) {
          window.open(item.url, '_blank');
          hideMenu();
        }
        break;
        
      case 'callback':
        if (item.callback) {
          item.callback();
          hideMenu();
        }
        break;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={() => hideMenu()}
    >
      <div 
        ref={menuRef}
        className="bg-white rounded-t-xl sm:rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col menu-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-lg text-gray-900">
            {currentMenuId === 'main' ? 'CryptoChap Menu' : 'Menu'}
          </h2>
          <button
            onClick={hideMenu}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Breadcrumbs */}
        <MenuBreadcrumbs />
        
        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {currentMenu.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              {section.title && (
                <h3 className="font-medium text-sm text-gray-500 px-1.5 mb-2">
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-2">
                {section.items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onSelect={() => handleItemSelect(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}