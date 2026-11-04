import { useRef } from 'react';
import { en } from '../i18n/en';
import { Icon } from '../components/ui/Icon';
import { useShellStore } from './store';
export function TabBar() {
  const tabs = useShellStore((state) => state.tabs);
  const activeId = useShellStore((state) => state.activeId);
  const activate = useShellStore((state) => state.activateDocument);
  const close = useShellStore((state) => state.closeDocument);
  const open = useShellStore((state) => state.openDocument);
  const root = useRef<HTMLDivElement>(null);
  if (!tabs.length) return null;
  return <div className="document-tabbar">
    <button className="icon-button tab-home" aria-label={en.tabs.home} title={en.ui.homeTab} onClick={() => { activate(null); }}><Icon name="home" /></button>
    <div ref={root} className="document-tabs" role="tablist" aria-label={en.tabs.documents} onKeyDown={(event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.id === activeId);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      const id = tabs[next]?.id;
      if (id) { activate(id); root.current?.querySelector<HTMLButtonElement>(`[data-document-id="${id}"]`)?.focus(); }
    }}>
      {tabs.map((tab) => <div className={`document-tab ${tab.id === activeId ? 'is-active' : ''}`} key={tab.id}>
        <button role="tab" className="document-tab-select" aria-label={tab.title} aria-selected={tab.id === activeId} tabIndex={tab.id === activeId ? 0 : -1} data-document-id={tab.id} onClick={() => { activate(tab.id); }}><Icon name="writer" /><span>{tab.title}</span>{tab.dirty && <i className="unsaved-dot" aria-label={en.title.unsaved} />}</button>
        <button className="document-tab-close" aria-label={`${en.tabs.closeDocument}: ${tab.title}`} title={en.ui.closeTab} onClick={() => { close(tab.id); }}><Icon name="close" /></button>
      </div>)}
    </div>
    <button className="icon-button tab-new" aria-label={en.tabs.newDocument} title={en.ui.newTab} onClick={() => { open({ title: `${en.title.document} ${tabs.length + 1}` }); }}><Icon name="plus" /></button>
  </div>;
}
