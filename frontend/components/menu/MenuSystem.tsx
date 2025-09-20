'use client';

import { useEffect, useState } from 'react';
import { useMenu } from '../../lib/menu/MenuContext';
import InteractiveMenu from './InteractiveMenu';
import { Menu } from 'lucide-react';

interface MenuSystemProps {
  onExecuteCommand?: (command: string) => void;
}

export default function MenuSystem({ onExecuteCommand }: MenuSystemProps) {
  const { isMenuVisible, showMenu } = useMenu();

  return (
    <>
      <InteractiveMenu />

      {/* Floating Menu Button - mobile only */}
      <div className="sm:hidden fixed bottom-20 right-4 z-20">
        <button
          onClick={showMenu}
          className="bg-whatsapp-green text-white rounded-full p-3 shadow-lg hover:bg-whatsapp-green-dark transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      </div>
    </>
  );
}