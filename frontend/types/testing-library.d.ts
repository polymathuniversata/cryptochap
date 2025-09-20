// Type definitions for @testing-library/react
declare module '@testing-library/react' {
  export interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    hydrate?: boolean;
    wrapper?: React.ComponentType;
  }

  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement) => void;
    rerender: (ui: React.ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
  }

  export function render(
    ui: React.ReactElement,
    options?: RenderOptions
  ): RenderResult;

  export const screen: {
    getByText: (text: string | RegExp) => HTMLElement;
    getByRole: (role: string, options?: { name?: string | RegExp }) => HTMLElement;
    getByPlaceholderText: (text: string | RegExp) => HTMLElement;
    getByTestId: (testId: string) => HTMLElement;
    queryByText: (text: string | RegExp) => HTMLElement | null;
    queryByRole: (role: string, options?: { name?: string | RegExp }) => HTMLElement | null;
    getAllByText: (text: string | RegExp) => HTMLElement[];
    getAllByRole: (role: string) => HTMLElement[];
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByRole: (role: string, options?: { name?: string | RegExp }) => Promise<HTMLElement>;
  };

  export function fireEvent(
    element: HTMLElement,
    event: Event
  ): void;
  export namespace fireEvent {
    function click(element: HTMLElement): void;
    function change(element: HTMLElement, options: { target: { value: string } }): void;
    function keyPress(element: HTMLElement, options: { key: string; code: string; shiftKey?: boolean }): void;
  }

  export function waitFor(
    callback: () => void | Promise<void>,
    options?: { timeout?: number }
  ): Promise<void>;
}