'use client';

import { useState, useEffect, useRef } from 'react';
import { SlashCommandProcessor, SlashCommand } from '../../lib/commands/SlashCommandProcessor';

interface CommandSuggestionsProps {
  inputValue: string;
  onSelectCommand: (command: string) => void;
}

export default function CommandSuggestions({ inputValue, onSelectCommand }: CommandSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue && inputValue.startsWith('/')) {
      const commandSuggestions = SlashCommandProcessor.getCommandSuggestions(inputValue);
      setSuggestions(commandSuggestions);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [inputValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Tab':
        case 'Enter':
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            const cmd = `/${suggestions[selectedIndex].command}`;
            onSelectCommand(cmd);
          }
          break;
        case 'Escape':
          setSuggestions([]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onSelectCommand]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.getElementById(`command-suggestion-${selectedIndex}`);
    if (selectedElement && suggestionsRef.current) {
      const container = suggestionsRef.current;
      const scrollTop = container.scrollTop;
      const offsetTop = selectedElement.offsetTop;
      const elementHeight = selectedElement.offsetHeight;
      
      if (offsetTop < scrollTop) {
        container.scrollTop = offsetTop;
      } else if (offsetTop + elementHeight > scrollTop + container.offsetHeight) {
        container.scrollTop = offsetTop + elementHeight - container.offsetHeight;
      }
    }
  }, [selectedIndex]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div 
      ref={suggestionsRef}
      className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-10 transition-all duration-200 animate-fade-in-down command-suggestions-backdrop"
    >
      <div className="p-3 bg-gradient-to-r from-whatsapp-green/10 to-blue-500/10 dark:from-whatsapp-green/20 dark:to-blue-500/20 text-xs font-semibold text-whatsapp-green-dark dark:text-whatsapp-green flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          Command Suggestions
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">↑/↓ to navigate</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {suggestions.map((command, index) => (
          <div 
            key={command.command}
            id={`command-suggestion-${index}`}
            className={`px-4 py-3 cursor-pointer flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
              index === selectedIndex ? 'bg-whatsapp-green/10 dark:bg-whatsapp-green/20 border-l-2 border-whatsapp-green' : ''
            }`}
            onClick={() => onSelectCommand(`/${command.command}`)}
          >
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-whatsapp-green-dark dark:text-whatsapp-green flex items-center">
                  <span className="mr-2 bg-whatsapp-green bg-opacity-10 dark:bg-opacity-20 text-whatsapp-green px-1.5 py-0.5 rounded text-xs font-mono">/{command.command}</span>
                </span>
                {command.aliases && command.aliases.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {command.aliases.map(a => `/${a}`).join(', ')}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 font-medium">{command.description}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">{command.usage}</div>
            </div>
            {index === selectedIndex && (
              <div className="flex items-center text-xs text-whatsapp-green dark:text-whatsapp-green self-center ml-2 bg-whatsapp-green/10 dark:bg-whatsapp-green/20 px-2 py-1 rounded-full whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5"></path>
                  <path d="M20 4v7a4 4 0 01-4 4H8a4 4 0 01-4-4V4"></path>
                  <path d="M4 20h16"></path>
                </svg>
                Tab
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}