import { vi } from 'vitest';

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  callback: Function;
  constructor(callback: any) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  // Helper to trigger resize
  trigger(entries: any[]) {
    this.callback(entries);
  }
};
