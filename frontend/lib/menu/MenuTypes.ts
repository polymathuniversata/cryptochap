// Menu item types and interfaces
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  command?: string;
  description?: string;
  children?: MenuItem[];
  disabled?: boolean;
  action?: 'command' | 'submenu' | 'link' | 'callback';
  url?: string; // For link action
  callback?: () => void; // For callback action
}

export interface MenuBreadcrumb {
  id: string;
  label: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface MenuState {
  currentMenuId: string;
  breadcrumbs: MenuBreadcrumb[];
  history: string[];
}

// Menu definition for the bot
export const MAIN_MENU: MenuSection[] = [
  {
    title: 'Wallet',
    items: [
      {
        id: 'balance',
        label: 'Check Balance',
        icon: '💰',
        command: '/balance',
        description: 'View your current USDC and ETH balance',
        action: 'command'
      },
      {
        id: 'address',
        label: 'Your Address',
        icon: '📇',
        command: '/address',
        description: 'Get your wallet address for deposits',
        action: 'command'
      },
      {
        id: 'history',
        label: 'Transaction History',
        icon: '📊',
        command: '/history',
        description: 'View your recent transactions',
        action: 'command'
      }
    ]
  },
  {
    title: 'Transactions',
    items: [
      {
        id: 'send_menu',
        label: 'Send Crypto',
        icon: '↗️',
        description: 'Send USDC or ETH to an address or phone number',
        action: 'submenu',
        children: []  // Will be populated from SEND_MENU
      },
      {
        id: 'buy_menu',
        label: 'Buy USDC',
        icon: '💵',
        description: 'Purchase USDC with your credit/debit card',
        action: 'submenu',
        children: []  // Will be populated from BUY_MENU
      },
      {
        id: 'receive',
        label: 'Receive Crypto',
        icon: '↙️',
        command: '/address',
        description: 'Get your address to receive crypto',
        action: 'command'
      }
    ]
  },
  {
    title: 'Information',
    items: [
      {
        id: 'price',
        label: 'Token Prices',
        icon: '📈',
        command: '/price ETH',
        description: 'Check current crypto prices',
        action: 'command'
      },
      {
        id: 'help',
        label: 'Help & Commands',
        icon: '❓',
        command: '/help',
        description: 'View available commands and get help',
        action: 'command'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        command: '/settings',
        description: 'Configure your preferences',
        action: 'command'
      }
    ]
  }
];

export const SEND_MENU: MenuSection[] = [
  {
    title: 'Quick Send',
    items: [
      {
        id: 'send_10_usdc',
        label: 'Send 10 USDC',
        icon: '🔵',
        command: '/send 10 USDC',
        description: 'Send 10 USDC to an address or phone',
        action: 'command'
      },
      {
        id: 'send_50_usdc',
        label: 'Send 50 USDC',
        icon: '🔵',
        command: '/send 50 USDC',
        description: 'Send 50 USDC to an address or phone',
        action: 'command'
      },
      {
        id: 'send_100_usdc',
        label: 'Send 100 USDC',
        icon: '🔵',
        command: '/send 100 USDC',
        description: 'Send 100 USDC to an address or phone',
        action: 'command'
      }
    ]
  },
  {
    title: 'Send ETH',
    items: [
      {
        id: 'send_0.01_eth',
        label: 'Send 0.01 ETH',
        icon: '💠',
        command: '/send 0.01 ETH',
        description: 'Send 0.01 ETH to an address or phone',
        action: 'command'
      },
      {
        id: 'send_0.1_eth',
        label: 'Send 0.1 ETH',
        icon: '💠',
        command: '/send 0.1 ETH',
        description: 'Send 0.1 ETH to an address or phone',
        action: 'command'
      }
    ]
  },
  {
    title: 'Custom',
    items: [
      {
        id: 'custom_send',
        label: 'Custom Amount',
        icon: '✏️',
        command: '/send',
        description: 'Send a custom amount of crypto',
        action: 'command'
      }
    ]
  }
];

export const BUY_MENU: MenuSection[] = [
  {
    title: 'Quick Buy',
    items: [
      {
        id: 'buy_10_usdc',
        label: 'Buy 10 USDC',
        icon: '💲',
        command: '/buy 10',
        description: 'Purchase 10 USDC',
        action: 'command'
      },
      {
        id: 'buy_50_usdc',
        label: 'Buy 50 USDC',
        icon: '💲',
        command: '/buy 50',
        description: 'Purchase 50 USDC',
        action: 'command'
      },
      {
        id: 'buy_100_usdc',
        label: 'Buy 100 USDC',
        icon: '💲',
        command: '/buy 100',
        description: 'Purchase 100 USDC',
        action: 'command'
      },
      {
        id: 'buy_custom',
        label: 'Custom Amount',
        icon: '✏️',
        command: '/buy',
        description: 'Purchase a custom amount of USDC',
        action: 'command'
      }
    ]
  },
  {
    title: 'Payment Methods',
    items: [
      {
        id: 'credit_card',
        label: 'Credit/Debit Card',
        icon: '💳',
        command: '/buy 50 card',
        description: 'Buy USDC with your credit or debit card',
        action: 'command'
      },
      {
        id: 'bank_transfer',
        label: 'Bank Transfer',
        icon: '🏦',
        command: '/buy 50 bank',
        description: 'Buy USDC via bank transfer (ACH/SEPA)',
        action: 'command'
      }
    ]
  }
];

// Helper to find a menu item by ID in any menu
export function findMenuItemById(id: string): MenuItem | null {
  // Check main menu
  for (const section of MAIN_MENU) {
    for (const item of section.items) {
      if (item.id === id) return item;
      
      // Check children
      if (item.children) {
        const found = item.children.find(child => child.id === id);
        if (found) return found;
      }
    }
  }
  
  // Check other menus
  const allMenus = [...MAIN_MENU, ...SEND_MENU, ...BUY_MENU];
  for (const section of allMenus) {
    for (const item of section.items) {
      if (item.id === id) return item;
    }
  }
  
  return null;
}

// Get menu sections by ID
export function getMenuSectionsById(id: string): MenuSection[] {
  switch (id) {
    case 'main':
      return MAIN_MENU;
    case 'send_menu':
      return SEND_MENU;
    case 'buy_menu':
      return BUY_MENU;
    default:
      return MAIN_MENU;
  }
}