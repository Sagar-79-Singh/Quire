import { useState } from 'react';
import { en } from '../i18n/en';
import { Dialog } from '../components/ui/Dialog';
import { Icon } from '../components/ui/Icon';
import type { MenuAction } from './shortcuts';
import { getActiveDocument, useShellStore, countWords } from './store';
export function Backstage({ onAction }: { onAction?: (action: MenuAction) => void }) {
  const [section, setSection] = useState<'new' | 'info'>('new');
  const setOpen = useShellStore((state) => state.setBackstageOpen);
  const open = useShellStore((state) => state.openDocument);
  const tabs = useShellStore((state) => state.tabs);
  const close = useShellStore((state) => state.closeDocument);
  const document = useShellStore(getActiveDocument);
  const closeBackstage = (): void => { setOpen(false); };
  return <Dialog title={en.backstage.title} onClose={closeBackstage} className="backstage" showClose={false}>
    <aside className="backstage-sidebar"><button className="backstage-back" aria-label={en.nav.back} onClick={closeBackstage}><Icon name="arrowLeft" size={20} /></button><h2>{en.backstage.title}</h2><nav aria-label={en.backstage.title}>
      <button className={section === 'new' ? 'is-active' : ''} aria-label={en.backstage.new} onClick={() => { setSection('new'); }}>{en.backstage.new}</button>
      {([{ label: en.backstage.open, action: 'open' }, { label: en.backstage.save, action: 'save' }, { label: en.backstage.saveAs, action: 'save-as' }, { label: en.backstage.export, action: 'export-pdf' }, { label: en.backstage.print, action: 'print' }] as const).map((item) => <button key={item.label} disabled={!onAction || (item.action !== 'open' && !document)} title={!onAction ? en.title.filePending : !document && item.action !== 'open' ? en.common.noDocument : item.label} aria-label={item.label} onClick={() => { onAction?.(item.action); closeBackstage(); }}>{item.label}</button>)}
      <button className={section === 'info' ? 'is-active' : ''} aria-label={en.backstage.info} onClick={() => { setSection('info'); }}>{en.backstage.info}</button>
      <button aria-label={en.backstage.close} disabled={!document} title={document ? en.backstage.close : en.common.noDocument} onClick={() => { if (document) close(document.id); }}>{en.backstage.close}</button>
    </nav><span className="backstage-brand">{en.app.name}</span></aside>
    <div className="backstage-main">{section === 'new' ? <><span className="eyebrow">{en.apps.writer}</span><h1>{en.backstage.new}</h1><p>{en.backstage.newDescription}</p><button className="new-document-large" aria-label={en.home.blank} onClick={() => { open({ title: `${en.title.document} ${tabs.length + 1}` }); closeBackstage(); }}><div><Icon name="plus" size={32} /></div><span>{en.home.blank}</span></button></> : <><span className="eyebrow">{en.app.name}</span><h1>{en.backstage.info}</h1><p>{en.backstage.infoDescription}</p><div className="info-card"><Icon name="info" size={32} /><dl><dt>{en.backstage.documentName}</dt><dd>{document?.title ?? en.common.noDocument}</dd><dt>{en.backstage.location}</dt><dd>{document?.path ?? en.backstage.notSaved}</dd><dt>{en.status.words}</dt><dd>{countWords(document?.content ?? '')}</dd></dl></div><div className="info-card"><Icon name="shield" size={32} /><dl><dt>{en.backstage.author}</dt><dd>{en.app.author}</dd><dt>{en.app.name}</dt><dd>{en.app.version}</dd></dl><p>{en.backstage.privacy}</p></div><small>{en.backstage.copyright}</small></>}</div>
  </Dialog>;
}
