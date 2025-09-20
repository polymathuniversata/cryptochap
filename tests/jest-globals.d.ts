// Jest global types
declare global {
  function describe(description: string, fn: () => void): void;
  function test(description: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
    }
  }
  
  function expect(actual: any): jest.Matchers<void>;
}

export {};