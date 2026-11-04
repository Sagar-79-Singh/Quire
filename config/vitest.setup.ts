import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
  Reflect.deleteProperty(window, 'quire');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('style');
});

function mockMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
}
mockMatchMedia();
beforeEach(() => { mockMatchMedia(); vi.stubGlobal('ResizeObserver', TestResizeObserver); Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => true) }); Object.defineProperty(document, 'queryCommandState', { configurable: true, value: vi.fn(() => false) }); });

class TestResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Element.prototype.scrollIntoView = vi.fn();
