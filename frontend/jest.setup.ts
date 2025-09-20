// jest-dom setup
import * as jestDom from '@testing-library/jest-dom';

// Extend Jest matchers
if (jestDom) {
  // This will extend the Jest matchers if the package is available
}

// Fallback: manually add common matchers if jest-dom is not available
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveValue(value: string): R;
      toBeDisabled(): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveStyle(style: Record<string, any>): R;
    }
  }
}

// Simple implementations if jest-dom is not available
if (typeof expect !== 'undefined') {
  expect.extend({
    toBeInTheDocument(received: Element | null) {
      const pass = received !== null && document.contains(received);
      return {
        message: () => pass ? 'Expected element not to be in document' : 'Expected element to be in document',
        pass,
      };
    },
    toHaveClass(received: Element, className: string) {
      const pass = received.classList.contains(className);
      return {
        message: () => pass ? `Expected element not to have class "${className}"` : `Expected element to have class "${className}"`,
        pass,
      };
    },
    toHaveValue(received: HTMLInputElement, value: string) {
      const pass = received.value === value;
      return {
        message: () => pass ? `Expected element not to have value "${value}"` : `Expected element to have value "${value}"`,
        pass,
      };
    },
    toBeDisabled(received: HTMLButtonElement | HTMLInputElement) {
      const pass = received.disabled;
      return {
        message: () => pass ? 'Expected element not to be disabled' : 'Expected element to be disabled',
        pass,
      };
    },
    toHaveAttribute(received: Element, attr: string, value?: any) {
      const actualValue = received.getAttribute(attr);
      const pass = value !== undefined ? actualValue === value : actualValue !== null;
      return {
        message: () => pass ? `Expected element not to have attribute "${attr}"` : `Expected element to have attribute "${attr}"`,
        pass,
      };
    },
    toHaveStyle(received: HTMLElement, style: Record<string, any>) {
      const computedStyle = window.getComputedStyle(received);
      const pass = Object.entries(style).every(([prop, value]) => computedStyle.getPropertyValue(prop) === value);
      return {
        message: () => pass ? 'Expected element not to have style' : 'Expected element to have style',
        pass,
      };
    },
  });
}