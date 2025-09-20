'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export default function ThemeProvider({ 
  children,
  defaultTheme = 'system' 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Initial setup
  useEffect(() => {
    // Check for user preference in localStorage
    const savedTheme = localStorage.getItem('crypto-chap-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  // Handle theme changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('crypto-chap-theme', theme);
    
    // Apply theme
    const root = window.document.documentElement;
    
    // Remove old classes
    root.classList.remove('light', 'dark');
    
    // Add appropriate class
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDarkMode(systemTheme === 'dark');
    } else {
      root.classList.add(theme);
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        setIsDarkMode(newTheme === 'dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}