'use client';

import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

interface CommandHistoryProps {
  onSelectCommand: (command: string) => void;
  maxItems?: number;
}

export default function CommandHistory({ onSelectCommand, maxItems = 5 }: CommandHistoryProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Load command history from localStorage on component mount
    const savedHistory = localStorage.getItem('cryptoChapCommandHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(Array.isArray(parsed) ? parsed.slice(0, maxItems) : []);
      } catch (e) {
        console.error('Error parsing command history:', e);
        setHistory([]);
      }
    }
  }, [maxItems]);

  const addToHistory = (command: string) => {
    // Update history with most recent command first, remove duplicates
    const updatedHistory = [command, ...history.filter(cmd => cmd !== command)].slice(0, maxItems);
    setHistory(updatedHistory);
    localStorage.setItem('cryptoChapCommandHistory', JSON.stringify(updatedHistory));
  };

  const removeFromHistory = (command: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    const updatedHistory = history.filter(cmd => cmd !== command);
    setHistory(updatedHistory);
    localStorage.setItem('cryptoChapCommandHistory', JSON.stringify(updatedHistory));
  };

  const handleSelect = (command: string) => {
    onSelectCommand(command);
    setVisible(false);
  };

  if (history.length === 0) return null;

  return (
    <>
      <button 
        onClick={() => setVisible(!visible)}
        className={`p-2 rounded-full transition-colors ${
          visible ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
        }`}
        title="Command History"
      >
        <Clock size={20} />
      </button>
      
      {visible && (
        <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-10 mb-2">
          <div className="p-2 bg-gray-100 text-xs text-gray-500 font-medium flex justify-between items-center">
            <span>Recent Commands</span>
            <button 
              onClick={() => setVisible(false)}
              className="hover:bg-gray-200 rounded p-0.5"
            >
              <X size={14} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {history.map((command) => (
              <div 
                key={command}
                className="px-3 py-2 cursor-pointer flex justify-between items-center hover:bg-gray-50"
                onClick={() => handleSelect(command)}
              >
                <span className="font-mono text-sm">{command}</span>
                <button
                  onClick={(e) => removeFromHistory(command, e)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Export this function to allow other components to add commands to history
export function addCommandToHistory(command: string) {
  const savedHistory = localStorage.getItem('cryptoChapCommandHistory');
  let history = [];
  
  try {
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // Update history with most recent command first, remove duplicates
    const updatedHistory = [command, ...history.filter((cmd: string) => cmd !== command)].slice(0, 10);
    localStorage.setItem('cryptoChapCommandHistory', JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Error updating command history:', e);
  }
}