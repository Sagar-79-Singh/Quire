import type { RecentDocument } from './recents';
import { normalizeRecents } from './recents';
import type { MenuAction } from './shortcuts';
import { en } from '../i18n/en';

import type { FilePayload, PrintRequest, SaveRequest, SaveResult, WindowAction } from './protocol';
export type { WindowAction } from './protocol';
export interface QuireBridge {
  platform: string;
  getRecents: () => Promise<unknown>;
  setRecents: (documents: RecentDocument[]) => Promise<void>;
  windowControl: (action: WindowAction) => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  onMenuAction: (listener: (action: MenuAction) => void) => () => void;
  openDocument: (path?: string) => Promise<FilePayload | null>;
  saveDocument: (request: SaveRequest) => Promise<SaveResult | null>;
  exportPdf: (request: PrintRequest) => Promise<SaveResult | null>;
  printDocument: (request: PrintRequest) => Promise<void>;
}
declare global { interface Window { quire?: QuireBridge } }
export interface ShellIO {
  loadRecents: () => Promise<RecentDocument[]>;
  saveRecents: (documents: RecentDocument[]) => Promise<boolean>;
  windowControl: (action: WindowAction) => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  onMenuAction: (listener: (action: MenuAction) => void) => () => void;
  isDesktop: boolean;
  platform: string;
  openFile: (path?: string) => Promise<FilePayload | null>;
  saveFile: (request: SaveRequest) => Promise<SaveResult | null>;
  exportPdf: (request: PrintRequest) => Promise<SaveResult | null>;
  printFile: (request: PrintRequest) => Promise<void>;
}
export interface IODependencies {
  getBridge: () => QuireBridge | undefined;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  onError: (message: string) => void;
  pickFile?: () => Promise<File | null>;
  download?: (name: string, data: Blob) => void;
  print?: () => void;
}
export const RECENTS_KEY = 'quire.recents.v1';
export function createShellIO(dependencies: IODependencies): ShellIO {
  const { getBridge, storage, onError } = dependencies;
  return {
    get isDesktop() { return Boolean(getBridge()); },
    get platform() { return getBridge()?.platform ?? 'browser'; },
    loadRecents: async () => {
      try {
        const bridge = getBridge();
        const value = bridge ? await bridge.getRecents() : storage.getItem(RECENTS_KEY);
        const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? normalizeRecents(parsed) : [];
      } catch { onError(en.toast.recentLoad); return []; }
    },
    saveRecents: async (documents) => {
      try {
        const normalized = normalizeRecents(documents);
        const bridge = getBridge();
        if (bridge) await bridge.setRecents(normalized);
        else storage.setItem(RECENTS_KEY, JSON.stringify(normalized));
        return true;
      } catch { onError(en.toast.recentSave); return false; }
    },
    windowControl: async (action) => {
      try { const bridge = getBridge(); if (bridge) await bridge.windowControl(action); }
      catch { onError(en.toast.window); }
    },
    toggleFullscreen: async () => {
      try { const bridge = getBridge(); if (bridge) await bridge.toggleFullscreen(); }
      catch { onError(en.toast.window); }
    },
    openFile: async (path) => {
      const bridge = getBridge();
      if (bridge) return bridge.openDocument(path);
      const file = await (dependencies.pickFile ?? pickBrowserFile)();
      if (!file) return null;
      return { name: file.name, path: null, data: await file.arrayBuffer() };
    },
    saveFile: async (request) => {
      const bridge = getBridge();
      if (bridge) return bridge.saveDocument(request);
      (dependencies.download ?? downloadBlob)(request.name.endsWith('.docx') ? request.name : `${request.name}.docx`, new Blob([request.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      return { name: request.name, path: request.path ?? request.name };
    },
    exportPdf: async (request) => {
      const bridge = getBridge();
      if (bridge) return bridge.exportPdf(request);
      onError(en.toast.browserExport); (dependencies.print ?? (() => { window.print(); }))(); return null;
    },
    printFile: async (request) => {
      const bridge = getBridge();
      if (bridge) return bridge.printDocument(request);
      (dependencies.print ?? (() => { window.print(); }))();
    },
    onMenuAction: (listener) => {
      try { return getBridge()?.onMenuAction(listener) ?? (() => {}); }
      catch { onError(en.toast.error); return () => {}; }
    },
  };
}
export function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  return { getItem: (key) => window.localStorage.getItem(key), setItem: (key, value) => { window.localStorage.setItem(key, value); } };
}
export function defaultIODependencies(onError: (message: string) => void): IODependencies {
  return { getBridge: () => window.quire, storage: browserStorage(), onError };
}

export function pickBrowserFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    input.addEventListener('change', () => { resolve(input.files?.[0] ?? null); }, { once: true });
    input.addEventListener('cancel', () => { resolve(null); }, { once: true });
    input.click();
  });
}
export function downloadBlob(name: string, data: Blob): void {
  const url = URL.createObjectURL(data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => { URL.revokeObjectURL(url); }, 0);
}
