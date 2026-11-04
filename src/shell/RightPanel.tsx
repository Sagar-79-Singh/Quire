import { en } from '../i18n/en';
import { Icon } from '../components/ui/Icon';
import { RibbonTabs } from '../components/ribbon/RibbonTabs';
import { StylesGallery } from '../apps/writer/StylesGallery';
import { useWriterStore } from '../apps/writer/store';
import { useShellStore } from './store';
export function RightPanel({ documentId, onStyle, onCommand }: { documentId?: string; onStyle?: (tag: string, className?: string) => void; onCommand?: (name: string, value?: string) => void }) {
  const open = useShellStore((state) => state.panelOpen);
  const tab = useShellStore((state) => state.panelTab);
  const doc = useWriterStore((state) => documentId ? state.documents[documentId] : undefined);
  return <aside className={`right-panel ${open ? 'is-open' : ''}`} aria-label={en.panel.label} aria-hidden={!open} hidden={!open}>
    <header className="panel-header"><RibbonTabs label={en.panel.label} value={tab} onChange={(value) => { useShellStore.getState().setPanelTab(value as 'styles' | 'shape' | 'comments'); }} items={[{ id: 'styles', label: en.panel.styles }, { id: 'shape', label: en.panel.shape }, { id: 'comments', label: en.panel.comments }]} /><button className="icon-button" aria-label={en.panel.close} onClick={() => { useShellStore.getState().setPanelOpen(false); }}><Icon name="close" /></button></header>
    {open && <div className="panel-content" role="tabpanel" aria-label={tab}>
      {tab === 'styles' && <><p className="panel-description">{en.panel.stylesDescription}</p>{onStyle ? <StylesGallery onApply={onStyle} /> : <p>{en.panel.stylesPending}</p>}</>}
      {tab === 'shape' && <>{doc?.selectedShape ? <div className="shape-format-controls"><h3>{en.writer.shapeSelected}</h3><label className="form-field"><span>{en.writer.fill}</span><input type="color" aria-label={en.writer.fill} defaultValue="#dbe7f6" onChange={(event) => { onCommand?.('shapeFill', event.target.value); }} /></label><label className="form-field"><span>{en.writer.outline}</span><input type="color" aria-label={en.writer.outline} defaultValue="#2B579A" onChange={(event) => { onCommand?.('shapeOutline', event.target.value); }} /></label><button className="secondary-button" onClick={() => { onCommand?.('shapeRotate', '15'); }}>{en.writer.rotate}</button><button className="secondary-button danger-text" onClick={() => { onCommand?.('shapeDelete'); }}>{en.writer.deleteShape}</button></div> : <div className="panel-empty"><Icon name="shape" size={32} /><h3>{en.panel.noShape}</h3><p>{en.writer.drawNote}</p></div>}</>}
      {tab === 'comments' && <><button className="primary-button" onClick={() => { onCommand?.('comment'); }} disabled={!onCommand}><Icon name="plus" />{en.writer.newComment}</button>{doc?.comments.length ? <div className="comment-list">{doc.comments.map((comment) => <article key={comment.id} className={`comment-card ${comment.resolved ? 'is-resolved' : ''}`}><header><strong>{comment.author}</strong><time>{new Date(comment.createdAt).toLocaleDateString()}</time></header><p>{comment.text}</p><footer><button className="text-button" onClick={() => { if (documentId) useWriterStore.getState().resolveComment(documentId, comment.id); }}>{comment.resolved ? en.writer.reopen : en.writer.resolve}</button><button className="icon-button" aria-label={en.writer.deleteComment} onClick={() => { if (documentId) useWriterStore.getState().deleteComment(documentId, comment.id); }}><Icon name="trash" /></button></footer></article>)}</div> : <div className="panel-empty"><Icon name="comment" size={32} /><h3>{en.panel.noComments}</h3><p>{en.panel.noCommentsDescription}</p></div>}</>}
    </div>}
  </aside>;
}
