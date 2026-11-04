import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { en } from '../i18n/en';
import { ToastProvider, useToast } from '../components/ui/Toast';
import { ThemeProvider } from '../theme/ThemeProvider';
import { HomeScreen } from './HomeScreen';
import { TitleBar } from './TitleBar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { Backstage } from './Backstage';
import { createShellIO, defaultIODependencies } from './io';
import type { ShellIO } from './io';
import { getActiveDocument, useShellStore } from './store';
import { appRegistry } from './appRegistry';
import { writerCommands } from '../apps/writer/commands';
import { installShortcuts } from './shortcuts';
import type { MenuAction } from './shortcuts';
import { AppContext } from './AppContext';
import { openDocumentFile, saveDocumentFile, exportPdfFile, printDocumentFile } from './fileOperations';
import { Icon } from '../components/ui/Icon';

function Shell({ injectedIO }: { injectedIO?: ShellIO }) {
  const notify = useToast();
  const io = useMemo(() => injectedIO ?? createShellIO(defaultIODependencies(notify)), [injectedIO, notify]);
  const document = useShellStore(getActiveDocument);
  const recents = useShellStore((state) => state.recents);
  const backstageOpen = useShellStore((state) => state.backstageOpen);
  const [ready, setReady] = useState(false);
  const runFile = useCallback((action: 'open' | 'save' | 'save-as' | 'export-pdf' | 'print', path?: string): void => {
    const operation = action === 'open' ? openDocumentFile(io, path) : action === 'save' ? saveDocumentFile(io) : action === 'save-as' ? saveDocumentFile(io, true) : action === 'export-pdf' ? exportPdfFile(io) : printDocumentFile(io);
    void operation.then((result) => { if (result.message) notify(result.message, result.ok ? 'success' : 'error'); }).catch(() => { notify(en.toast.file); });
  }, [io, notify, runFile]);
  const dispatch = useCallback((action: MenuAction) => {
    const state = useShellStore.getState();
    const active = getActiveDocument(state);
    switch (action) {
      case 'new': state.openDocument({ title: `${en.title.document} ${state.tabs.length + 1}` }); break;
      case 'home': state.activateDocument(null); break;
      case 'close-document': if (active) state.closeDocument(active.id); break;
      case 'next-tab': state.cycleDocument(1); break;
      case 'previous-tab': state.cycleDocument(-1); break;
      case 'zoom-in': state.setZoom(state.zoom + 10); break;
      case 'zoom-out': state.setZoom(state.zoom - 10); break;
      case 'zoom-reset': state.setZoom(100); break;
      case 'theme-light': state.setTheme('light'); break;
      case 'theme-dark': state.setTheme('dark'); break;
      case 'theme-system': state.setTheme('system'); break;
      case 'toggle-panel': state.setPanelOpen(!state.panelOpen); break;
      case 'toggle-ribbon': state.setRibbonMode(state.ribbonMode === 'compact' ? 'expanded' : 'compact'); break;
      case 'fullscreen': void io.toggleFullscreen().catch(() => { notify(en.toast.window); }); break;
      case 'open': case 'save': case 'save-as': case 'export-pdf': case 'print': runFile(action); break;
      case 'undo': case 'redo': case 'find': case 'replace': case 'spelling': writerCommands.dispatch(action); break;
      case 'word-count': writerCommands.dispatch('wordCount'); break;
      case 'about': writerCommands.dispatch('about'); break;
    }
  }, [io, notify]);
  useEffect(() => {
    let cancelled = false;
    void io.loadRecents().then((items) => { if (!cancelled) { useShellStore.getState().replaceRecents(items); setReady(true); } }).catch(() => { if (!cancelled) notify(en.toast.recentLoad); });
    return () => { cancelled = true; };
  }, [io]);
  useEffect(() => { if (ready) void io.saveRecents(recents).catch(() => { notify(en.toast.recentSave); }); }, [io, ready, recents, notify]);
  const autoSave = useShellStore((state) => state.autoSave);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (!autoSave || !document?.dirty || !document.path) return;
    autoSaveTimer.current = setTimeout(() => { void saveDocumentFile(io).then((result) => { if (!result.ok && result.message) notify(result.message); }).catch(() => { notify(en.toast.file); }); }, 1200);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [autoSave, document?.id, document?.dirty, document?.content, document?.path, io, notify]);
  useEffect(() => { try { localStorage.setItem('quire.autosave', autoSave ? '1' : '0'); } catch { /* preference is best-effort */ } }, [autoSave]);
  useEffect(() => { try { useShellStore.getState().setAutoSave(localStorage.getItem('quire.autosave') === '1'); } catch { /* default off */ } }, []);
  useEffect(() => io.onMenuAction(dispatch), [io, dispatch]);
  useEffect(() => installShortcuts(window, dispatch), [dispatch]);
  const ActiveApp = document ? appRegistry[document.appType].component : null;
  return <AppContext.Provider value={{ io, dispatch }}><div className="app-shell"><TitleBar io={io} onAction={dispatch} />{document && <div className="file-tabline"><button className={`file-tab ${backstageOpen ? 'is-active' : ''}`} aria-label={en.backstage.title} aria-expanded={backstageOpen} onClick={() => { useShellStore.getState().setBackstageOpen(!backstageOpen); }}>{en.backstage.title}</button><TabBar /></div>}{document ? <main className="app-content"><Suspense fallback={<div className="app-loading" role="status"><Icon name="writer" size={32} /><span>{en.app.loading}</span></div>}>{ActiveApp && <ActiveApp />}</Suspense></main> : <main className="app-content"><HomeScreen onOpen={() => { runFile('open'); }} onOpenRecent={(recent) => { runFile('open', recent.path); }} /></main>}<StatusBar />{backstageOpen && <Backstage onAction={dispatch} />}</div></AppContext.Provider>;
}
export default function App({ io }: { io?: ShellIO }) { return <ToastProvider><ThemeProvider><Shell injectedIO={io} /></ThemeProvider></ToastProvider>; }
