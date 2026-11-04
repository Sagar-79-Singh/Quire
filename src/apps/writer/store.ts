import { create } from 'zustand';
import { defaultSettings, htmlToText, textToHtml } from './model';
import { defaultIndent } from './Ruler';
import type { ParagraphIndent } from './Ruler';
import type { PageSettings, TrackedChange, WriterComment } from './model';
import { sanitizeHtml } from './model';
export interface WriterSnapshot { html: string; settings: PageSettings; }
export interface WriterDocument extends WriterSnapshot {
  past: WriterSnapshot[]; future: WriterSnapshot[]; comments: WriterComment[]; changes: TrackedChange[];
  trackChanges: boolean; spellcheck: boolean; selectedBlock: string | null; selectedShape: string | null;
  pageCount: number; currentPage: number; activeFormats: string[]; painter: string | null; indent: ParagraphIndent;
}
export interface WriterState {
  documents: Record<string, WriterDocument>;
  ensure: (id: string, content?: string) => void;
  update: (id: string, html: string, history?: boolean) => void;
  configure: (id: string, patch: Partial<PageSettings>) => void;
  load: (id: string, snapshot: WriterSnapshot) => void;
  undo: (id: string) => void; redo: (id: string) => void;
  setTrackChanges: (id: string, value: boolean) => void;
  setSpellcheck: (id: string, value: boolean) => void;
  selectBlock: (id: string, block: string | null) => void;
  selectShape: (id: string, block: string | null) => void;
  setPagination: (id: string, count: number, current?: number) => void;
  setFormats: (id: string, formats: string[]) => void;
  setPainter: (id: string, style: string | null) => void;
  setIndent: (id: string, patch: Partial<ParagraphIndent>) => void;
  addComment: (id: string, text: string, now?: number) => string;
  deleteComment: (id: string, comment: string) => void;
  resolveComment: (id: string, comment: string) => void;
  addChange: (id: string, kind: TrackedChange['kind'], html: string) => void;
  resolveChanges: (id: string, accept: boolean, change?: string) => void;
  remove: (id: string) => void;
}
export function newWriterDocument(content = ''): WriterDocument {
  return { html: textToHtml(content), settings: structuredClone(defaultSettings), past: [], future: [], comments: [], changes: [], trackChanges: false, spellcheck: true, selectedBlock: null, selectedShape: null, pageCount: 1, currentPage: 1, activeFormats: [], painter: null, indent: { ...defaultIndent } };
}
const snapshot = (doc: WriterDocument): WriterSnapshot => ({ html: doc.html, settings: structuredClone(doc.settings) });
export function createWriterStore() {
  return create<WriterState>((set) => {
    const modify = (id: string, fn: (doc: WriterDocument) => WriterDocument): void => { set((state) => { const doc = state.documents[id]; return doc ? { documents: { ...state.documents, [id]: fn(doc) } } : state; }); };
    return {
      documents: {},
      ensure: (id, content = '') => { set((state) => state.documents[id] ? state : { documents: { ...state.documents, [id]: newWriterDocument(content) } }); },
      update: (id, html, history = true) => { modify(id, (doc) => doc.html === html ? doc : { ...doc, html, past: history ? [...doc.past.slice(-99), snapshot(doc)] : doc.past, future: [] }); },
      configure: (id, patch) => { modify(id, (doc) => ({ ...doc, settings: { ...doc.settings, ...patch }, past: [...doc.past.slice(-99), snapshot(doc)], future: [] })); },
      load: (id, value) => { modify(id, (doc) => ({ ...doc, ...value, past: [], future: [] })); },
      undo: (id) => { modify(id, (doc) => { const previous = doc.past[doc.past.length - 1]; return previous ? { ...doc, ...previous, past: doc.past.slice(0, -1), future: [snapshot(doc), ...doc.future] } : doc; }); },
      redo: (id) => { modify(id, (doc) => { const next = doc.future[0]; return next ? { ...doc, ...next, past: [...doc.past, snapshot(doc)], future: doc.future.slice(1) } : doc; }); },
      setTrackChanges: (id, trackChanges) => { modify(id, (doc) => ({ ...doc, trackChanges })); },
      setSpellcheck: (id, spellcheck) => { modify(id, (doc) => ({ ...doc, spellcheck })); },
      selectBlock: (id, selectedBlock) => { modify(id, (doc) => ({ ...doc, selectedBlock })); },
      selectShape: (id, selectedShape) => { modify(id, (doc) => ({ ...doc, selectedShape })); },
      setPagination: (id, pageCount, currentPage) => { modify(id, (doc) => doc.pageCount === pageCount && (currentPage === undefined || doc.currentPage === currentPage) ? doc : ({ ...doc, pageCount, currentPage: currentPage ?? doc.currentPage })); },
      setFormats: (id, activeFormats) => { modify(id, (doc) => ({ ...doc, activeFormats })); },
      setPainter: (id, painter) => { modify(id, (doc) => ({ ...doc, painter })); },
      setIndent: (id, indent) => { modify(id, (doc) => ({ ...doc, indent: { ...doc.indent, ...indent } })); },
      addComment: (id, text, now = Date.now()) => { const comment = crypto.randomUUID(); modify(id, (doc) => ({ ...doc, comments: [...doc.comments, { id: comment, text, author: 'Sagar', createdAt: now, resolved: false }] })); return comment; },
      deleteComment: (id, comment) => { modify(id, (doc) => ({ ...doc, comments: doc.comments.filter((item) => item.id !== comment) })); },
      resolveComment: (id, comment) => { modify(id, (doc) => ({ ...doc, comments: doc.comments.map((item) => item.id === comment ? { ...item, resolved: !item.resolved } : item) })); },
      addChange: (id, kind, html) => { modify(id, (doc) => ({ ...doc, changes: [...doc.changes, { id: crypto.randomUUID(), kind, html, author: 'Sagar', createdAt: Date.now() }] })); },
      resolveChanges: (id, accept, change) => { modify(id, (doc) => {
        const changes = doc.changes.filter((item) => !change || item.id === change); let html = doc.html;
        for (const item of changes) { const marker = `data-change="${item.id}"`; const expression = new RegExp(`<(ins|del)([^>]*${marker}[^>]*)>([\\s\\S]*?)<\\/\\1>`, 'g'); html = html.replace(expression, (_all, _tag, _attrs, inner: string) => (item.kind === 'insert') === accept ? inner : ''); }
        return { ...doc, html: sanitizeHtml(html), changes: doc.changes.filter((item) => change && item.id !== change), past: [...doc.past, snapshot(doc)], future: [] };
      }); },
      remove: (id) => { set((state) => { const documents = { ...state.documents }; delete documents[id]; return { documents }; }); },
    };
  });
}
export const useWriterStore = createWriterStore();
export function writerText(doc: WriterDocument): string { return htmlToText(doc.html); }
