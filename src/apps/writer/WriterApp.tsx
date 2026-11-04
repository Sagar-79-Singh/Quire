import { useCallback, useEffect, useRef, useState } from 'react';
import { en } from '../../i18n/en';
import { getActiveDocument, useShellStore } from '../../shell/store';
import { RightPanel } from '../../shell/RightPanel';
import { useToast } from '../../components/ui/Toast';
import { Editor } from './Editor';
import type { EditorHandle } from './Editor';
import { Pages } from './Pages';
import type { ParagraphIndent, RulerUnit } from './Ruler';
import { WriterRibbon } from './Ribbon';
import { WriterDialogs } from './WriterDialogs';
import type { DialogKind } from './WriterDialogs';
import { useWriterStore } from './store';
import { escapeHtml, htmlToText, shapeHtml } from './model';
import type { PageSettings, ShapeKind } from './model';
import { writerCommands } from './commands';
import { useAppContext } from '../../shell/AppContext';

export default function WriterApp() {
  const context = useAppContext();
  const documentTab = useShellStore(getActiveDocument);
  const view = useShellStore((state) => state.viewMode);
  const zoom = useShellStore((state) => state.zoom);
  const ensure = useWriterStore((state) => state.ensure);
  const writer = useWriterStore((state) => documentTab ? state.documents[documentTab.id] : undefined);
  const editor = useRef<EditorHandle>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [ruler, setRuler] = useState(true);
  const [gridlines, setGridlines] = useState(false);
  const [marginGuides, setMarginGuides] = useState(true);
  const [rulerUnit, setRulerUnit] = useState<RulerUnit>('in');
  const [recipients, setRecipients] = useState<Record<string, string>[]>([]);
  const notify = useToast();
  useEffect(() => { if (documentTab) ensure(documentTab.id, documentTab.content); }, [documentTab?.id, ensure]);
  const applyStyle = useCallback((tag: string, className?: string): void => { editor.current?.execute('formatBlock', tag); if (className) editor.current?.execute('blockClass', className); }, []);
  const configure = useCallback((patch: Partial<PageSettings>): void => { if (documentTab) useWriterStore.getState().configure(documentTab.id, patch); }, [documentTab?.id]);
  const insert = useCallback((html: string): void => { editor.current?.insert(html); }, []);
  const changeIndent = useCallback((patch: Partial<ParagraphIndent>): void => { if (!documentTab) return; useWriterStore.getState().setIndent(documentTab.id, patch); const indent = useWriterStore.getState().documents[documentTab.id]?.indent; if (indent) editor.current?.execute('paragraphIndent', JSON.stringify(indent)); }, [documentTab?.id]);
  const addComment = useCallback((text: string): void => { if (documentTab) { useWriterStore.getState().addComment(documentTab.id, text); useShellStore.getState().setPanelTab('comments'); } }, [documentTab?.id]);
  const command = useCallback((name: string, value?: string): void => {
    if (!documentTab) return;
    const id = documentTab.id; const state = useWriterStore.getState(); const current = state.documents[id]; if (!current) return;
    if (name === 'undo' || name === 'redo') { state[name](id); const next = useWriterStore.getState().documents[id]; if (next) useShellStore.getState().setDocumentContent(id, htmlToText(next.html)); return; }
    if (name === 'error') { notify(value ?? en.toast.error); return; }
    if (name === 'insertShape') { insert(shapeHtml((value ?? 'rect') as ShapeKind)); return; }
    if (name === 'trackChanges') { state.setTrackChanges(id, !current.trackChanges); return; }
    if (name === 'acceptChanges' || name === 'rejectChanges') { state.resolveChanges(id, name === 'acceptChanges'); useShellStore.getState().setDocumentContent(id, htmlToText(useWriterStore.getState().documents[id]?.html ?? '')); return; }
    if (name === 'deleteComment') { const comment = current.comments[current.comments.length - 1]; if (comment) state.deleteComment(id, comment.id); return; }
    if (name === 'toggleMarkup') { document.querySelector('.editor-surface')?.classList.toggle('hide-markup'); return; }
    if (name === 'nextChange' || name === 'previousChange') { const changes = Array.from(document.querySelectorAll('.editor-surface [data-change]')); const target = name === 'nextChange' ? changes[0] : changes[changes.length - 1]; target?.scrollIntoView({ block: 'center' }); return; }
    if (name === 'toc' || name === 'bibliography' || name === 'buildIndex') {
      const root = document.querySelector('.editor-surface');
      const selector = name === 'toc' ? 'h1,h2,h3' : name === 'bibliography' ? '[data-citation]' : '[data-index]';
      const entries = Array.from(root?.querySelectorAll(selector) ?? []).map((element) => element.textContent ?? '').filter(Boolean);
      if (!entries.length) { notify(en.writer.noHeadings, 'info'); return; }
      insert(`<section data-generated="${name}"><h2>${name === 'toc' ? en.writer.toc : name === 'bibliography' ? en.writer.bibliography : en.writer.index}</h2>${[...new Set(entries)].map((entry) => `<p>${escapeHtml(entry)}</p>`).join('')}</section><p><br></p>`); return;
    }
    if (name === 'formatPainter') { const selection = window.getSelection(); const node = selection?.anchorNode; const element = node instanceof Element ? node : node?.parentElement; const style = element ? getComputedStyle(element) : null; state.setPainter(id, style ? `color:${style.color};font-weight:${style.fontWeight};font-style:${style.fontStyle}` : null); notify(en.writer.painterOn, 'info'); return; }
    if (name === 'multilevel') { editor.current?.execute('insertOrderedList'); editor.current?.execute('indent'); return; }
    if (name === 'lineHeight') { editor.current?.execute('paragraphSpacing', JSON.stringify({ before: 0, after: current.settings.paragraphSpacing, lineHeight: Number(value) })); return; }
    if (name === 'comment') { setDialog('comment'); return; }
    if (name === 'createBookmark') { const title = current.selectedBlock ?? `bookmark-${Date.now()}`; editor.current?.insert(`<span id="${escapeHtml(title)}" data-bookmark="true"></span>`); notify(en.writer.added, 'info'); return; }
    if (name === 'paste') { notify(en.toast.clipboard, 'info'); return; }
    editor.current?.execute(name, value);
  }, [documentTab?.id, insert, notify]);
  useEffect(() => writerCommands.subscribe(({ name, value }) => {
    if (['undo', 'redo'].includes(name)) command(name, value);
    else if (['find', 'replace', 'wordCount', 'spelling', 'comment', 'about'].includes(name)) setDialog(name as DialogKind);
    else command(name, value);
  }), [command]);
  const merge = useCallback((): void => {
    const html = editor.current?.getHtml(); if (!html || !recipients.length) return;
    for (const recipient of recipients.slice(0, 50)) {
      const merged = html.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => escapeHtml(recipient[key.trim()] ?? ''));
      const id = useShellStore.getState().openDocument({ title: `${documentTab?.title ?? en.common.untitled} — ${recipient.Name ?? recipient.name ?? en.writer.recipients}` });
      useWriterStore.getState().ensure(id); useWriterStore.getState().load(id, { html: merged, settings: structuredClone(useWriterStore.getState().documents[documentTab?.id ?? '']?.settings ?? writer!.settings) });
    }
    notify(en.writer.merged, 'success');
  }, [recipients, documentTab?.id, documentTab?.title, notify, writer?.settings]);
  if (!documentTab || !writer) return null;
  return <section className="writer-app" aria-label={en.apps.writer}>
    <WriterRibbon doc={writer} onCommand={command} onDialog={setDialog} onSettings={configure} onStyle={applyStyle} onFile={(action) => { if (context) context.dispatch(action); else useShellStore.getState().setBackstageOpen(true); }} ruler={ruler} gridlines={gridlines} onRuler={() => { setRuler(!ruler); }} onGridlines={() => { setGridlines(!gridlines); }} onInsert={insert} recipients={recipients} onRecipients={setRecipients} onMerge={merge} isDesktop={context?.io.isDesktop ?? false} marginGuides={marginGuides} onMarginGuides={() => { setMarginGuides(!marginGuides); }} rulerUnit={rulerUnit} onRulerUnit={setRulerUnit} />
    <div className="writer-workspace"><div className="writer-canvas-wrap"><Pages settings={writer.settings} pageCount={writer.pageCount} zoom={zoom} gridlines={gridlines} view={view} ruler={ruler} marginGuides={marginGuides} rulerUnit={rulerUnit} indent={writer.indent} onIndentChange={changeIndent} onZoom={(value) => { useShellStore.getState().setZoom(value); }}><Editor ref={editor} documentId={documentTab.id} onError={notify} /></Pages></div><RightPanel documentId={documentTab.id} onStyle={applyStyle} onCommand={command} /></div>
    {dialog && <WriterDialogs kind={dialog} onClose={() => { setDialog(null); }} editor={editor.current} settings={writer.settings} onSettings={configure} onInsert={insert} onNotify={notify} onComment={addComment} onZoom={(value) => { useShellStore.getState().setZoom(value); }} zoom={zoom} html={writer.html} />}
  </section>;
}
