'use client';

import React, { createContext, useContext, useState, useReducer, ReactNode } from 'react';
import { MenuBreadcrumb, MenuSection, MenuState, getMenuSectionsById } from './MenuTypes';

// Define the context interface
interface MenuContextType {
  currentMenu: MenuSection[];
  currentMenuId: string;
  breadcrumbs: MenuBreadcrumb[];
  navigateToMenu: (menuId: string, label: string) => void;
  navigateBack: () => void;
  navigateHome: () => void;
  executeCommand: (command: string) => void;
  isMenuVisible: boolean;
  showMenu: () => void;
  hideMenu: () => void;
}

// Create the context with default values
const MenuContext = createContext<MenuContextType>({
  currentMenu: [],
  currentMenuId: 'main',
  breadcrumbs: [{ id: 'main', label: 'Main Menu' }],
  navigateToMenu: () => {},
  navigateBack: () => {},
  navigateHome: () => {},
  executeCommand: () => {},
  isMenuVisible: false,
  showMenu: () => {},
  hideMenu: () => {}
});

// Action types for the reducer
type MenuAction = 
  | { type: 'NAVIGATE_TO', payload: { menuId: string, label: string } }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'NAVIGATE_HOME' }
  | { type: 'SHOW_MENU' }
  | { type: 'HIDE_MENU' };

// Reducer function for menu state
function menuReducer(state: MenuState & { isVisible: boolean }, action: MenuAction): MenuState & { isVisible: boolean } {
  switch (action.type) {
    case 'NAVIGATE_TO':
      return {
        ...state,
        currentMenuId: action.payload.menuId,
        breadcrumbs: [...state.breadcrumbs, { id: action.payload.menuId, label: action.payload.label }],
        history: [...state.history, state.currentMenuId]
      };
    
    case 'NAVIGATE_BACK':
      if (state.breadcrumbs.length <= 1) return state;
      
      const newBreadcrumbs = state.breadcrumbs.slice(0, -1);
      const newMenuId = newBreadcrumbs[newBreadcrumbs.length - 1].id;
      
      return {
        ...state,
        currentMenuId: newMenuId,
        breadcrumbs: newBreadcrumbs,
        history: state.history.slice(0, -1)
      };
    
    case 'NAVIGATE_HOME':
      return {
        ...state,
        currentMenuId: 'main',
        breadcrumbs: [{ id: 'main', label: 'Main Menu' }],
        history: []
      };
      
    case 'SHOW_MENU':
      return { ...state, isVisible: true };
      
    case 'HIDE_MENU':
      return { ...state, isVisible: false };
    
    default:
      return state;
  }
}

// Provider component
export function MenuProvider({ children, onExecuteCommand }: { 
  children: ReactNode;
  onExecuteCommand?: (command: string) => void;
}) {
  const initialState: MenuState & { isVisible: boolean } = {
    currentMenuId: 'main',
    breadcrumbs: [{ id: 'main', label: 'Main Menu' }],
    history: [],
    isVisible: false
  };
  
  const [state, dispatch] = useReducer(menuReducer, initialState);
  const [currentMenu, setCurrentMenu] = useState<MenuSection[]>(getMenuSectionsById('main'));
  
  // Update the menu sections when the current menu ID changes
  React.useEffect(() => {
    const sections = getMenuSectionsById(state.currentMenuId);
    setCurrentMenu(sections);
  }, [state.currentMenuId]);
  
  const navigateToMenu = (menuId: string, label: string) => {
    dispatch({ type: 'NAVIGATE_TO', payload: { menuId, label } });
  };
  
  const navigateBack = () => {
    dispatch({ type: 'NAVIGATE_BACK' });
  };
  
  const navigateHome = () => {
    dispatch({ type: 'NAVIGATE_HOME' });
  };
  
  const executeCommand = (command: string) => {
    // Hide the menu when a command is executed
    dispatch({ type: 'HIDE_MENU' });
    
    // Call the callback if provided
    if (onExecuteCommand) {
      onExecuteCommand(command);
    }
  };
  
  const showMenu = () => {
    dispatch({ type: 'SHOW_MENU' });
  };
  
  const hideMenu = () => {
    dispatch({ type: 'HIDE_MENU' });
  };
  
  const value = {
    currentMenu,
    currentMenuId: state.currentMenuId,
    breadcrumbs: state.breadcrumbs,
    navigateToMenu,
    navigateBack,
    navigateHome,
    executeCommand,
    isMenuVisible: state.isVisible,
    showMenu,
    hideMenu
  };
  
  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

// Custom hook to use the menu context
export function useMenu() {
  return useContext(MenuContext);
}