import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

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
if (!globalThis.crypto.randomUUID) Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: randomUUID });
beforeEach(() => { mockMatchMedia(); vi.stubGlobal('ResizeObserver', TestResizeObserver); Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn((command: string, _show?: boolean, value?: string) => {
    if (command === 'insertHTML' && value) {
      const selection = window.getSelection(); const active = document.activeElement;
      const root = active instanceof HTMLElement && active.isContentEditable ? active : document.querySelector<HTMLElement>('[contenteditable="true"]');
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const template = document.createElement('template'); template.innerHTML = value;
      if (range && root?.contains(range.commonAncestorContainer)) { range.deleteContents(); range.insertNode(template.content); range.collapse(false); }
      else root?.append(template.content);
    }
    return true;
  }) }); Object.defineProperty(document, 'queryCommandState', { configurable: true, value: vi.fn(() => false) }); });

class TestResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Element.prototype.scrollIntoView = vi.fn();
