'use client';

import React, { useState } from 'react';
import { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  OutlineButton,
  IconButton,
  DropdownButton,
  DropdownItem, 
  DropdownDivider,
  Badge,
  StatusBadge,
  SuccessBadge,
  DangerBadge,
  WarningBadge,
  Tooltip,
  Tip,
  useToast,
  useToastUtils,
  useDialog,
  useDialogUtils,
  LoadingIndicator,
  SkeletonLoader,
  TransactionLoading,
  ThemeToggle
} from '@/components/ui';
import { 
  Check, 
  X, 
  AlertCircle, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Info,
  Search,
  Trash,
  Copy,
  Send
} from 'lucide-react';

export default function UITestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToastUtils();
  const { alert, confirm, prompt } = useDialogUtils();
  const [txStage, setTxStage] = useState<'preparing' | 'signing' | 'broadcasting' | 'confirming'>('preparing');
  const [txProgress, setTxProgress] = useState(0);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred. Please try again.',
      warning: 'Please review your information before continuing.',
      info: 'This is an informational message.'
    };

    toast(messages[type], type);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const simulateTransaction = async () => {
    // Reset
    setTxStage('preparing');
    setTxProgress(0);
    
    // Preparing
    setIsLoading(true);
    
    await new Promise(r => setTimeout(r, 1500));
    setTxProgress(25);
    
    // Signing
    setTxStage('signing');
    await new Promise(r => setTimeout(r, 1500));
    setTxProgress(50);
    
    // Broadcasting
    setTxStage('broadcasting');
    await new Promise(r => setTimeout(r, 1500));
    setTxProgress(75);
    
    // Confirming
    setTxStage('confirming');
    await new Promise(r => setTimeout(r, 1500));
    setTxProgress(100);
    
    setIsLoading(false);
    showToast('success');
  };

  const showAlert = () => {
    alert('This is an alert message that provides information to the user.');
  };

  const showConfirm = async () => {
    const result = await confirm('Are you sure you want to continue with this action?');
    if (result) {
      showToast('success');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">UI Components Test Page</h1>
        <ThemeToggle />
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default Button</Button>
          <PrimaryButton>Primary</PrimaryButton>
          <SecondaryButton>Secondary</SecondaryButton>
          <OutlineButton>Outline</OutlineButton>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link Style</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button isLoading>Loading</Button>
          <IconButton>
            <Bell size={18} />
          </IconButton>
          <PrimaryButton onClick={simulateLoading} isLoading={isLoading}>
            {isLoading ? 'Processing...' : 'Click Me'}
          </PrimaryButton>
          <Button leftIcon={<Check size={16} />}>With Icon</Button>
          <Button tooltip="This button has a tooltip" variant="outline">Hover Me</Button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dropdowns</h2>
        <div className="flex flex-wrap gap-3">
          <DropdownButton label="Account" icon={<User size={16} />}>
            <DropdownItem>Profile</DropdownItem>
            <DropdownItem>Settings</DropdownItem>
            <DropdownDivider />
            <DropdownItem>Help</DropdownItem>
            <DropdownItem>Logout</DropdownItem>
          </DropdownButton>
          
          <DropdownButton label="Actions" position="bottom-right">
            <DropdownItem onClick={() => showToast('success')}>
              <span className="flex items-center">
                <Check size={16} className="mr-2 text-green-500" />
                Approve
              </span>
            </DropdownItem>
            <DropdownItem onClick={() => showToast('error')}>
              <span className="flex items-center">
                <X size={16} className="mr-2 text-red-500" />
                Reject
              </span>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem disabled>
              <span className="flex items-center">
                <AlertCircle size={16} className="mr-2" />
                Disabled Action
              </span>
            </DropdownItem>
          </DropdownButton>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge rounded>Rounded</Badge>
          <Badge icon={<Info size={12} />}>With Icon</Badge>
          <SuccessBadge>Success Badge</SuccessBadge>
          <DangerBadge>Danger Badge</DangerBadge>
          <WarningBadge>Warning Badge</WarningBadge>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4">
          <StatusBadge status="online" />
          <StatusBadge status="offline" />
          <StatusBadge status="away" />
          <StatusBadge status="busy" />
          <StatusBadge status="pending" />
          <StatusBadge status="approved" />
          <StatusBadge status="rejected" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tooltips</h2>
        <div className="flex flex-wrap gap-6">
          <Tooltip content="This is a tooltip that appears on top">
            <Button variant="outline">Hover Me (Top)</Button>
          </Tooltip>
          
          <Tooltip content="This tooltip appears on the bottom" position="bottom">
            <Button variant="outline">Hover Me (Bottom)</Button>
          </Tooltip>
          
          <Tooltip content="This tooltip appears on the left" position="left">
            <Button variant="outline">Hover Me (Left)</Button>
          </Tooltip>
          
          <Tooltip content="This tooltip appears on the right" position="right">
            <Button variant="outline">Hover Me (Right)</Button>
          </Tooltip>
          
          <Tip tip="Simple tooltip">
            <span className="cursor-help underline">Simple tip</span>
          </Tip>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => showToast('success')} variant="success">Success Toast</Button>
          <Button onClick={() => showToast('error')} variant="danger">Error Toast</Button>
          <Button onClick={() => showToast('warning')} variant="warning">Warning Toast</Button>
          <Button onClick={() => showToast('info')} variant="primary">Info Toast</Button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dialog Prompts</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={showAlert} variant="primary">Show Alert</Button>
          <Button onClick={showConfirm} variant="primary">Show Confirm</Button>
          <Button 
            onClick={() => {
              prompt(
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    className="px-3 py-2 border rounded" 
                  />
                  <textarea 
                    placeholder="Your message" 
                    className="px-3 py-2 border rounded"
                    rows={3}
                  ></textarea>
                </div>,
                'Custom Dialog'
              );
            }} 
            variant="primary"
          >
            Custom Dialog
          </Button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-3">Spinner Types</h3>
            <div className="flex flex-col gap-4">
              <LoadingIndicator type="spinner" text="Loading..." />
              <LoadingIndicator type="pulse" text="Pulsing..." />
              <LoadingIndicator type="dots" text="Processing..." />
            </div>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-3">Skeleton Loaders</h3>
            <SkeletonLoader lines={3} />
            
            <div className="flex gap-2 mt-4">
              <div className="flex-shrink-0">
                <SkeletonLoader width={48} height={48} rounded={true} />
              </div>
              <div className="flex-1">
                <SkeletonLoader lines={2} />
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-3">Transaction Progress</h3>
            <TransactionLoading stage={txStage} progress={txProgress} />
            <div className="mt-4">
              <Button onClick={simulateTransaction} isLoading={isLoading}>
                {isLoading ? 'Processing...' : 'Simulate Transaction'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}