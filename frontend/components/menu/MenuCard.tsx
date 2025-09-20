'use client';

import { useEffect, useRef } from 'react';
import { MenuItem } from '../../lib/menu/MenuTypes';

interface MenuCardProps {
  item: MenuItem;
  onSelect: () => void;
}

export default function MenuCard({ item, onSelect }: MenuCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Add entrance animation when component mounts
  useEffect(() => {
    const card = cardRef.current;
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      
      // Staggered animation delay based on element position
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3.5 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200
        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        {item.icon && (
          <div className="text-xl">{item.icon}</div>
        )}
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{item.label}</h3>
          {item.description && (
            <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
          )}
          
          {/* Command hint */}
          {item.command && (
            <div className="mt-1.5 text-xs font-mono bg-gray-100 rounded px-1.5 py-0.5 text-gray-500 inline-block">
              {item.command}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}