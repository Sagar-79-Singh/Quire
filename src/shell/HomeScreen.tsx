import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { en } from '../i18n/en';
import { Icon } from '../components/ui/Icon';
import { ThemeToggle } from '../theme/ThemeProvider';
import { useShellStore } from './store';
import type { RecentDocument } from './store';
import { filterTemplates, starterTemplates, templateContent } from './templates';
import type { StarterTemplate } from './templates';

export const RECENT_ROW_HEIGHT = 72;
export function visibleVirtualRange(scrollTop: number, viewportHeight: number, total: number, rowHeight = RECENT_ROW_HEIGHT, overscan = 2): { start: number; end: number } {
  const count = Math.max(0, total);
  const height = Math.max(1, rowHeight);
  const start = Math.min(count, Math.max(0, Math.floor(Math.max(0, scrollTop) / height) - overscan));
  return { start, end: Math.min(count, Math.max(start, Math.ceil((Math.max(0, scrollTop) + viewportHeight) / height) + overscan)) };
}
export function formatRecentDate(timestamp: number, now: number, locale = 'en-US'): string {
  const date = new Date(timestamp);
  if (new Date(now).toDateString() === date.toDateString()) return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: new Date(now).getFullYear() !== date.getFullYear() ? 'numeric' : undefined }).format(date);
}
export function TemplatePreview({ template }: { template?: StarterTemplate }) {
  return <div className={`template-preview ${template ? 'has-template' : 'is-blank'}`} style={{ '--template-accent': template?.color ?? 'var(--q-accent)' } as CSSProperties} aria-hidden="true">
    <div className="mini-page">{template ? <><div className="mini-accent" /><div className="mini-eyebrow">{en.app.name}</div><div className="mini-heading">{template.heading}</div><div className="mini-rule" />{template.lines.map((line, index) => <div className="mini-section" key={line}><span>{line}</span><i /><i style={{ width: `${78 - index * 9}%` }} /></div>)}</> : <Icon name="plus" size={32} />}</div>
  </div>;
}
export interface HomeScreenProps { onOpen?: () => void; onOpenRecent?: (document: RecentDocument) => void; now?: number; }
export function HomeScreen({ onOpen, onOpenRecent, now = Date.now() }: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [activeNav, setActiveNav] = useState('home');
  const recentSection = useRef<HTMLElement>(null);
  const homeMain = useRef<HTMLElement>(null);
  const templates = useMemo(() => filterTemplates(query), [query]);
  const tabs = useShellStore((state) => state.tabs);
  const recents = useShellStore((state) => state.recents);
  const openDocument = useShellStore((state) => state.openDocument);
  const removeRecent = useShellStore((state) => state.removeRecent);
  const create = (template?: StarterTemplate): void => { openDocument({ title: template?.name ?? `${en.title.document} ${tabs.length + 1}`, templateId: template?.id, content: template ? templateContent(template) : '' }); };
  const range = visibleVirtualRange(scrollTop, 288, recents.length);
  return <div className="home-screen">
    <aside className="home-sidebar" aria-label={en.app.name}>
      <div className="brand"><div className="brand-mark"><Icon name="writer" size={24} /></div><span>{en.app.name}</span></div>
      <nav className="home-nav" aria-label={en.nav.home}>
        <button className={activeNav === 'home' ? 'is-active' : ''} aria-label={en.nav.home} onClick={() => { setActiveNav('home'); if (homeMain.current) homeMain.current.scrollTop = 0; }}><Icon name="home" size={20} />{en.nav.home}</button>
        <button aria-label={en.nav.new} onClick={() => { create(); }}><Icon name="plus" size={20} />{en.nav.new}</button>
        <button disabled={!onOpen} title={onOpen ? en.nav.open : en.title.filePending} aria-label={en.nav.open} onClick={() => { onOpen?.(); }}><Icon name="folder" size={20} />{en.nav.open}</button>
        <button className={activeNav === 'recent' ? 'is-active' : ''} aria-label={en.nav.recent} onClick={() => { setActiveNav('recent'); recentSection.current?.scrollIntoView({ block: 'start' }); }}><Icon name="clock" size={20} />{en.nav.recent}</button>
      </nav>
      <div className="home-sidebar-bottom"><ThemeToggle /><div className="private-label"><Icon name="shield" /><span>{en.app.offline}</span></div><span className="home-author">{en.app.by}</span></div>
    </aside>
    <main ref={homeMain} className="home-main">
      <div className="home-content">
        <header className="home-header"><div className="home-app-label"><Icon name="writer" /><span>{en.apps.writer}</span></div><h1>{en.home.greeting}</h1><p>{en.home.subtitle}</p></header>
        <section className="template-section" aria-labelledby="new-document-heading">
          <div className="section-heading"><h2 id="new-document-heading">{en.home.newDocument}</h2><div className="template-search"><Icon name="search" /><input type="search" aria-label={en.home.searchTemplates} placeholder={en.home.searchTemplates} value={query} onChange={(event) => { setQuery(event.target.value); }} /></div></div>
          <div className="template-grid">
            {!query.trim() && <button className="template-card blank-card" aria-label={en.home.blank} onClick={() => { create(); }}><TemplatePreview /><span className="template-name">{en.home.blank}</span><span className="template-description">{en.home.blankDescription}</span></button>}
            {templates.map((template) => <button key={template.id} className="template-card" aria-label={`${en.home.templateLabel}: ${template.name}`} onClick={() => { create(template); }}><TemplatePreview template={template} /><span className="template-name">{template.name}</span><span className="template-description">{template.description}</span></button>)}
          </div>
          {templates.length === 0 && <p className="no-results" role="status">{en.home.noTemplates}</p>}
          <span className="sr-only" role="status">{templates.length} {en.home.results}</span>
        </section>
        <section ref={recentSection} className="recent-section" aria-labelledby="recent-heading">
          <div className="section-heading"><div><h2 id="recent-heading">{en.home.recent}</h2><p>{en.home.recentSubtitle}</p></div><span className="count-badge">{recents.length}</span></div>
          {recents.length === 0 ? <div className="recent-empty"><div className="empty-icon"><Icon name="clock" size={24} /></div><div><h3>{en.home.noRecent}</h3><p>{en.home.noRecentDescription}</p></div></div> : <div className="recent-list" role="list" aria-label={en.home.recent} tabIndex={0} onScroll={(event) => { setScrollTop(event.currentTarget.scrollTop); }}>
            <div className="recent-virtual-space" style={{ height: recents.length * RECENT_ROW_HEIGHT }}>
              {recents.slice(range.start, range.end).map((document, offset) => <div className="recent-row" role="listitem" key={document.id} style={{ transform: `translateY(${(range.start + offset) * RECENT_ROW_HEIGHT}px)` }}>
                <button className="recent-open" disabled={!onOpenRecent} title={onOpenRecent ? document.path : en.title.filePending} aria-label={`${en.home.openRecent}: ${document.title}`} onClick={() => { onOpenRecent?.(document); }}><div className="recent-thumbnail" aria-hidden="true">{document.thumbnail ? <img src={document.thumbnail} alt="" /> : <><Icon name="writer" size={20} /><i /><i /><i /></>}</div><span className="recent-name"><strong>{document.title}</strong><span>{document.path}</span></span><time dateTime={new Date(document.modifiedAt).toISOString()}>{formatRecentDate(document.modifiedAt, now)}</time></button>
                <button className="icon-button recent-remove" aria-label={`${en.home.remove}: ${document.title}`} title={en.home.remove} onClick={() => { removeRecent(document.id); }}><Icon name="close" /></button>
              </div>)}
            </div>
          </div>}
        </section>
        <footer className="home-footer"><span>{en.app.tagline}</span><span><Icon name="shield" />{en.home.local}</span></footer>
      </div>
    </main>
  </div>;
}
