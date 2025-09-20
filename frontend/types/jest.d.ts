// Jest type definitions to resolve TypeScript errors
declare global {
  function describe(description: string, spec: () => void): void;
  function test(description: string, spec: () => void): void;
  function beforeEach(spec: () => void): void;
  
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toThrow(): R;
    }
  }
  
  function expect(actual: any): jest.Matchers<void>;
}

export {};