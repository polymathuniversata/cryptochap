'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import ThemeProvider from './ThemeProvider';
import ErrorBoundary from './ErrorBoundary';
import MobileOptimizations from './MobileOptimizations';

// Define UI state and actions
interface UIState {
  isMobileMenuOpen: boolean;
  isLoading: boolean;
  notifications: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  }[];
  modals: {
    id: string;
    isOpen: boolean;
    data?: any;
  }[];
  currentView: 'chat' | 'wallet' | 'settings' | 'transactions';
  lastInteraction: Date;
}

type UIAction =
  | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'OPEN_MODAL'; payload: { id: string; data?: any } }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'SET_VIEW'; payload: UIState['currentView'] }
  | { type: 'UPDATE_LAST_INTERACTION' };

// Context and reducer
const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | undefined>(undefined);

const initialState: UIState = {
  isMobileMenuOpen: false,
  isLoading: false,
  notifications: [],
  modals: [],
  currentView: 'chat',
  lastInteraction: new Date(),
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        isMobileMenuOpen: action.payload !== undefined ? action.payload : !state.isMobileMenuOpen,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { id: Date.now().toString(), ...action.payload },
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    case 'OPEN_MODAL':
      // Check if modal exists
      const existingModalIndex = state.modals.findIndex(m => m.id === action.payload.id);
      
      if (existingModalIndex >= 0) {
        // Update existing modal
        const updatedModals = [...state.modals];
        updatedModals[existingModalIndex] = {
          ...updatedModals[existingModalIndex],
          isOpen: true,
          data: action.payload.data || updatedModals[existingModalIndex].data,
        };
        
        return {
          ...state,
          modals: updatedModals,
        };
      } else {
        // Add new modal
        return {
          ...state,
          modals: [
            ...state.modals,
            { id: action.payload.id, isOpen: true, data: action.payload.data },
          ],
        };
      }
    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: state.modals.map((modal) =>
          modal.id === action.payload ? { ...modal, isOpen: false } : modal
        ),
      };
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
      };
    case 'UPDATE_LAST_INTERACTION':
      return {
        ...state,
        lastInteraction: new Date(),
      };
    default:
      return state;
  }
}

// Custom hook
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

// Provider component
interface UIProviderProps {
  children: ReactNode;
}

export default function UIProvider({ children }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Track user interactions
  React.useEffect(() => {
    const handleInteraction = () => {
      dispatch({ type: 'UPDATE_LAST_INTERACTION' });
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      <ErrorBoundary>
        <ThemeProvider>
          <MobileOptimizations>
            {children}
          </MobileOptimizations>
        </ThemeProvider>
      </ErrorBoundary>
    </UIContext.Provider>
  );
}