import { vi } from 'vitest';

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  constructor(callback: any) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
