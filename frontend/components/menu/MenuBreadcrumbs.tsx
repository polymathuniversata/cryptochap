'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useMenu } from '../../lib/menu/MenuContext';

export default function MenuBreadcrumbs() {
  const { breadcrumbs, navigateBack, navigateHome } = useMenu();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center text-sm text-gray-600 px-2 py-1.5 bg-gray-50 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
      {/* Home/Main link */}
      <button
        onClick={navigateHome}
        className="hover:text-blue-600 hover:underline transition-colors"
      >
        Main Menu
      </button>

      {/* Path segments */}
      {breadcrumbs.slice(1).map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <span className="mx-1.5 text-gray-400">/</span>
          {index === breadcrumbs.length - 2 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <button
              onClick={() => {
                // Navigate back multiple steps
                for (let i = 0; i < breadcrumbs.length - index - 2; i++) {
                  navigateBack();
                }
              }}
              className="hover:text-blue-600 hover:underline transition-colors"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}