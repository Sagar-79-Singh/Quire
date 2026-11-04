import type { RecentDocument } from './store';
import { normalizeRecents } from './store';
import type { MenuAction } from './shortcuts';
import { en } from '../i18n/en';

import type { WindowAction } from './protocol';
export type { WindowAction } from './protocol';
export interface QuireBridge {
  platform: string;
  getRecents: () => Promise<unknown>;
  setRecents: (documents: RecentDocument[]) => Promise<void>;
  windowControl: (action: WindowAction) => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  onMenuAction: (listener: (action: MenuAction) => void) => () => void;
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
}
export interface IODependencies {
  getBridge: () => QuireBridge | undefined;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  onError: (message: string) => void;
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
