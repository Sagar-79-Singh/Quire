import { create } from 'zustand';
import type { ThemePreference } from '../theme/tokens';
import { en } from '../i18n/en';
import { normalizeRecents } from './recents';
import type { RecentDocument } from './recents';
export type { RecentDocument } from './recents';

export type AppType = 'writer' | 'sheets' | 'slides';
export type ViewMode = 'print' | 'web' | 'read';
export type PanelTab = 'styles' | 'shape' | 'comments';
export type RibbonMode = 'compact' | 'expanded';
export interface DocumentTab {
  id: string;
  title: string;
  appType: AppType;
  path: string | null;
  templateId: string;
  content: string;
  dirty: boolean;
  createdAt: number;
}
export interface NewDocument {
  title: string;
  templateId?: string;
  content?: string;
  path?: string;
}
export interface ShellState {
  tabs: DocumentTab[];
  activeId: string | null;
  recents: RecentDocument[];
  theme: ThemePreference;
  autoSave: boolean;
  ribbonMode: RibbonMode;
  panelOpen: boolean;
  panelTab: PanelTab;
  viewMode: ViewMode;
  zoom: number;
  backstageOpen: boolean;
  openDocument: (document: NewDocument) => string;
  closeDocument: (id: string) => void;
  activateDocument: (id: string | null) => void;
  cycleDocument: (direction: 1 | -1) => void;
  renameDocument: (id: string, title: string) => void;
  setDocumentContent: (id: string, content: string) => void;
  markSaved: (id: string, path: string, title?: string) => void;
  setTheme: (theme: ThemePreference) => void;
  setAutoSave: (enabled: boolean) => void;
  setRibbonMode: (mode: RibbonMode) => void;
  setPanelOpen: (open: boolean) => void;
  setPanelTab: (tab: PanelTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setBackstageOpen: (open: boolean) => void;
  addRecent: (document: RecentDocument) => void;
  removeRecent: (id: string) => void;
  replaceRecents: (documents: RecentDocument[]) => void;
}

export const MIN_ZOOM = 25;
export const MAX_ZOOM = 400;
export const clampZoom = (value: number): number => Number.isFinite(value) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value))) : 100;
export const countWords = (text: string): number => (text.trim().match(/\S+/g) ?? []).length;

export function createShellStore(now: () => number = Date.now, identify: () => string = () => crypto.randomUUID()) {
  return create<ShellState>((set) => ({
    tabs: [], activeId: null, recents: [], theme: 'system', autoSave: false,
    ribbonMode: 'compact', panelOpen: false, panelTab: 'styles', viewMode: 'print', zoom: 100, backstageOpen: false,
    openDocument: (input) => {
      const id = identify();
      const title = input.title.trim().slice(0, 260) || en.common.untitled;
      const document: DocumentTab = {
        id, title, appType: 'writer', path: input.path ?? null,
        templateId: input.templateId ?? 'blank', content: input.content ?? '', dirty: false, createdAt: now(),
      };
      set((state) => ({ tabs: [...state.tabs, document], activeId: id, backstageOpen: false }));
      return id;
    },
    closeDocument: (id) => set((state) => {
      const index = state.tabs.findIndex((tab) => tab.id === id);
      if (index < 0) return state;
      const tabs = state.tabs.filter((tab) => tab.id !== id);
      const activeId = state.activeId === id ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? null) : state.activeId;
      return { tabs, activeId, backstageOpen: false };
    }),
    activateDocument: (id) => set((state) => id === null || state.tabs.some((tab) => tab.id === id) ? { activeId: id, backstageOpen: false } : state),
    cycleDocument: (direction) => set((state) => {
      if (!state.tabs.length) return state;
      const current = Math.max(0, state.tabs.findIndex((tab) => tab.id === state.activeId));
      const next = (current + direction + state.tabs.length) % state.tabs.length;
      return { activeId: state.tabs[next]?.id ?? null };
    }),
    renameDocument: (id, title) => set((state) => {
      const clean = title.trim().slice(0, 260);
      if (!clean) return state;
      return { tabs: state.tabs.map((tab) => tab.id === id && tab.title !== clean ? { ...tab, title: clean, dirty: true } : tab) };
    }),
    setDocumentContent: (id, content) => set((state) => ({ tabs: state.tabs.map((tab) => tab.id === id ? { ...tab, content, dirty: true } : tab) })),
    markSaved: (id, path, title) => set((state) => ({ tabs: state.tabs.map((tab) => tab.id === id ? { ...tab, path, title: title ?? tab.title, dirty: false } : tab) })),
    setTheme: (theme) => set({ theme }),
    setAutoSave: (autoSave) => set({ autoSave }),
    setRibbonMode: (ribbonMode) => set({ ribbonMode }),
    setPanelOpen: (panelOpen) => set({ panelOpen }),
    setPanelTab: (panelTab) => set({ panelTab, panelOpen: true }),
    setViewMode: (viewMode) => set({ viewMode }),
    setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
    setBackstageOpen: (backstageOpen) => set({ backstageOpen }),
    addRecent: (document) => set((state) => ({ recents: normalizeRecents([document, ...state.recents]) })),
    removeRecent: (id) => set((state) => ({ recents: state.recents.filter((item) => item.id !== id) })),
    replaceRecents: (recents) => set({ recents: normalizeRecents(recents) }),
  }));
}

export const useShellStore = createShellStore();
export function resetShellStore(): void {
  useShellStore.setState({
    tabs: [], activeId: null, recents: [], theme: 'system', autoSave: false,
    ribbonMode: 'compact', panelOpen: false, panelTab: 'styles', viewMode: 'print', zoom: 100, backstageOpen: false,
  });
}
export function getActiveDocument(state: ShellState): DocumentTab | undefined {
  return state.tabs.find((tab) => tab.id === state.activeId);
}
