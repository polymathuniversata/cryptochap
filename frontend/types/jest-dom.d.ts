// Type definitions for @testing-library/jest-dom
declare module '@testing-library/jest-dom' {
  // This module extends Jest matchers
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveValue(value?: string): R;
      toBeDisabled(): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveStyle(style: Record<string, any>): R;
    }
  }
}