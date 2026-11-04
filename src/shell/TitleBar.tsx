import { useEffect, useRef, useState } from 'react';
import { writerCommands } from '../apps/writer/commands';
import { useWriterStore } from '../apps/writer/store';
import { en } from '../i18n/en';
import { Icon } from '../components/ui/Icon';
import { Toggle } from '../components/ui/Toggle';
import { useShellStore, getActiveDocument } from './store';
import type { ShellIO } from './io';
import type { MenuAction } from './shortcuts';

interface Tool { label: string; action: MenuAction; }
export const shellTools: Tool[] = [
  { label: en.tabs.newDocument, action: 'new' }, { label: en.nav.home, action: 'home' },
  { label: en.ribbon.light, action: 'theme-light' }, { label: en.ribbon.dark, action: 'theme-dark' }, { label: en.ribbon.system, action: 'theme-system' },
  { label: en.ribbon.showPanel, action: 'toggle-panel' }, { label: en.ribbon.zoomIn, action: 'zoom-in' }, { label: en.ribbon.zoomOut, action: 'zoom-out' },
  { label: en.ribbon.resetZoom, action: 'zoom-reset' }, { label: en.ribbon.expanded, action: 'toggle-ribbon' },
  { label: en.nav.open, action: 'open' }, { label: en.backstage.save, action: 'save' }, { label: en.backstage.export, action: 'export-pdf' }, { label: en.backstage.print, action: 'print' }, { label: en.writer.find, action: 'find' }, { label: en.writer.replace, action: 'replace' },
];
export function TitleBar({ io, onAction }: { io: ShellIO; onAction: (action: MenuAction) => void }) {
  const document = useShellStore(getActiveDocument);
  const autoSave = useShellStore((state) => state.autoSave);
  const writer = useWriterStore((state) => document ? state.documents[document.id] : undefined);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRoot = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);
  const rename = useShellStore((state) => state.renameDocument);
  useEffect(() => {
    const outside = (event: MouseEvent): void => { if (event.target instanceof Node && !searchRoot.current?.contains(event.target)) setSearchOpen(false); };
    window.addEventListener('mousedown', outside);
    return () => { window.removeEventListener('mousedown', outside); };
  }, []);
  const commit = (): void => { if (document && !cancelled.current) rename(document.id, name); setRenaming(false); };
  const results = shellTools.filter((tool) => tool.label.toLowerCase().includes(query.trim().toLowerCase()));
  return <header className="title-bar" data-platform={io.platform}>
    <div className="titlebar-left no-drag"><button className="titlebar-logo" aria-label={en.nav.home} title={en.nav.home} onClick={() => { onAction('home'); }}><Icon name="writer" /></button><Toggle label={en.title.autosave} checked={autoSave} disabled={!document?.path} disabledReason={en.title.autosavePending} compact onChange={(value) => { useShellStore.getState().setAutoSave(value); }} /></div>
    <div className="titlebar-name">{document ? renaming ? <input autoFocus aria-label={en.title.renameLabel} maxLength={260} value={name} onChange={(event) => { setName(event.target.value); }} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { cancelled.current = true; setRenaming(false); } }} /> : <button className="filename-button" data-document-name aria-label={en.title.rename} title={en.title.rename} onClick={() => { cancelled.current = false; setName(document.title); setRenaming(true); }}>{document.title}{document.dirty && <span aria-label={en.title.unsaved}>*</span>}</button> : <span className="titlebar-app-name">{en.app.name}</span>}</div>
    <div className="titlebar-search no-drag" ref={searchRoot}><Icon name="search" /><input type="search" role="combobox" aria-label={en.title.searchLabel} aria-expanded={searchOpen} aria-autocomplete="list" aria-controls="tool-results" autoComplete="off" placeholder={en.title.search} value={query} onFocus={() => { setSearchOpen(true); }} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => {
      if (event.key === 'Escape') { setSearchOpen(false); event.currentTarget.blur(); }
      if (event.key === 'ArrowDown') { event.preventDefault(); searchRoot.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus(); }
      if (event.key === 'Enter' && results[0]) { onAction(results[0].action); setSearchOpen(false); }
    }} />
      {searchOpen && <div className="tool-results" id="tool-results" role="listbox" aria-label={en.title.searchLabel}>{results.length ? results.map((tool) => <button key={tool.action} role="option" aria-selected={false} onClick={() => { onAction(tool.action); setSearchOpen(false); }}><Icon name="search" /><span>{tool.label}</span></button>) : <p role="status">{en.title.noResults}</p>}</div>}
    </div>
    <div className="titlebar-actions no-drag"><button className="icon-button" disabled={!writer?.past.length} title={en.ui.undoShortcut} aria-label={en.title.undo} aria-disabled={!writer?.past.length} onClick={() => { writerCommands.dispatch('undo'); }}><Icon name="undo" /></button><button className="icon-button" disabled={!writer?.future.length} title={en.ui.redoShortcut} aria-label={en.title.redo} aria-disabled={!writer?.future.length} onClick={() => { writerCommands.dispatch('redo'); }}><Icon name="redo" /></button><button className="icon-button" disabled={!document} title={en.ui.saveShortcut} aria-label={en.title.save} aria-disabled={!document} onClick={() => { onAction('save'); }}><Icon name="save" /></button></div>
    <div className="window-controls no-drag">{([{ action: 'minimize', icon: 'minimize', label: en.nav.minimize }, { action: 'maximize', icon: 'maximize', label: en.nav.maximize }, { action: 'close', icon: 'close', label: en.nav.close }] as const).map((control) => <button key={control.action} className={`window-control window-${control.action}`} aria-label={control.label} title={io.isDesktop ? control.label : en.nav.windowUnavailable} disabled={!io.isDesktop} onClick={() => { void io.windowControl(control.action); }}><Icon name={control.icon} /></button>)}</div>
  </header>;
}
