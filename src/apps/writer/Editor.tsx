import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent, CSSProperties } from 'react';
import { useWriterStore } from './store';
import { htmlToText, sanitizeHtml } from './model';
import { paginateBlocks } from './pagination';
import type { BlockMeasurement } from './pagination';
import { en } from '../../i18n/en';
import { useShellStore } from '../../shell/store';

export interface EditorHandle {
  execute: (command: string, value?: string) => void;
  insert: (html: string) => void;
  focus: () => void;
  getHtml: () => string;
  selectAll: () => void;
  find: (query: string, next?: boolean) => boolean;
  replace: (query: string, replacement: string, all?: boolean) => number;
}
export interface EditorProps { documentId: string; onTextInput?: (text: string) => void; onError?: (message: string) => void; commandExecutor?: (command: string, value?: string) => boolean; }
export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor({ documentId, onTextInput, onError, commandExecutor }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const doc = useWriterStore((state) => state.documents[documentId]);
  const update = useWriterStore((state) => state.update);
  const readOnly = useShellStore((state) => state.viewMode === 'read');
  const lastDocument = useRef(documentId);
  const measure = useCallback(() => {
    const element = root.current; if (!element || !doc) return;
    const state = useWriterStore.getState().documents[documentId]; if (!state) return;
    const children = Array.from(element.children) as HTMLElement[];
    children.forEach((child) => { child.style.marginBottom = ''; });
    const size = state.settings; const capacity = (size.paper === 'a4' ? size.orientation === 'portrait' ? 1123 : 794 : size.paper === 'legal' ? size.orientation === 'portrait' ? 1344 : 816 : size.orientation === 'portrait' ? 1056 : 816) - size.margins.top - size.margins.bottom;
    const blocks: BlockMeasurement[] = children.map((child, index) => { const style = getComputedStyle(child); child.dataset.block = child.dataset.block || `block-${index}`; return { id: child.dataset.block, height: child.getBoundingClientRect().height, marginBefore: parseFloat(style.marginTop) || 0, marginAfter: parseFloat(style.marginBottom) || 0, breakBefore: child.dataset.pageBreak === 'true' }; });
    const result = paginateBlocks(blocks, capacity);
    for (const pageBreak of result.breaks) { const child = children.find((item) => item.dataset.block === pageBreak.beforeId); if (child) child.style.marginBottom = `${pageBreak.extraSpace}px`; }
    useWriterStore.getState().setPagination(documentId, result.pageCount);
  }, [documentId, doc?.settings, doc?.html]);
  useEffect(() => {
    const element = root.current; if (!element || !doc) return;
    if (element.innerHTML !== doc.html) element.innerHTML = sanitizeHtml(doc.html);
    if (lastDocument.current !== documentId) { savedRange.current = null; lastDocument.current = documentId; element.focus(); }
    measure();
  }, [doc?.html, documentId, measure]);
  useEffect(() => {
    const element = root.current; if (!element) return;
    const observer = new ResizeObserver(measure); Array.from(element.children).forEach((child) => { observer.observe(child); });
    return () => { observer.disconnect(); };
  }, [measure, doc?.html]);
  const remember = useCallback(() => {
    const selection = window.getSelection();
    if (selection?.rangeCount && root.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
      const anchor = selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement;
      const block = anchor?.closest('[data-block]');
      useWriterStore.getState().selectBlock(documentId, block?.getAttribute('data-block') ?? null);
      useWriterStore.getState().selectShape(documentId, anchor?.closest('[data-shape]')?.getAttribute('data-block') ?? null);
      const formats = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].filter((command) => document.queryCommandState(command));
      useWriterStore.getState().setFormats(documentId, formats);
    }
  }, [documentId]);
  const restore = useCallback(() => {
    const element = root.current; if (!element) return; element.focus();
    const selection = window.getSelection(); if (!selection) return;
    if (savedRange.current && element.contains(savedRange.current.commonAncestorContainer)) { selection.removeAllRanges(); selection.addRange(savedRange.current); }
    else { const range = document.createRange(); range.selectNodeContents(element); range.collapse(false); selection.removeAllRanges(); selection.addRange(range); }
  }, []);
  const sync = useCallback((history = true) => {
    const element = root.current; if (!element) return;
    if (!element.children.length) element.innerHTML = '<p><br></p>';
    Array.from(element.children).forEach((child, index) => { child.setAttribute('data-block', child.getAttribute('data-block') || `block-${index}-${crypto.randomUUID()}`); });
    const html = element.innerHTML; update(documentId, html, history);
    const text = htmlToText(html); useShellStore.getState().setDocumentContent(documentId, text); onTextInput?.(text); remember(); measure();
  }, [documentId, update, onTextInput, remember, measure]);
  const execute = useCallback((command: string, value?: string) => {
    try {
      restore();
      if (commandExecutor) commandExecutor(command, value);
      else if (command === 'fontSize') {
        document.execCommand('fontSize', false, '7');
        root.current?.querySelectorAll('font[size="7"]').forEach((font) => { const span = document.createElement('span'); span.style.fontSize = `${value || 11}pt`; span.innerHTML = font.innerHTML; font.replaceWith(span); });
      } else document.execCommand(command, false, value);
      sync();
    } catch { onError?.(en.toast.format); }
  }, [restore, commandExecutor, sync, onError]);
  const insert = useCallback((html: string) => { execute('insertHTML', sanitizeHtml(html)); }, [execute]);
  const find = useCallback((query: string, next = true) => {
    if (!query || !root.current) return false;
    const finder = window as Window & { find?: (text: string, caseSensitive?: boolean, backwards?: boolean, wrap?: boolean, wholeWord?: boolean, searchInFrames?: boolean, showDialog?: boolean) => boolean };
    restore(); return finder.find?.(query, false, !next, true) ?? false;
  }, [restore]);
  useImperativeHandle(ref, () => ({
    execute, insert, find,
    focus: () => { root.current?.focus(); },
    getHtml: () => root.current?.innerHTML ?? doc?.html ?? '',
    selectAll: () => { restore(); document.execCommand('selectAll'); remember(); },
    replace: (query, replacement, all = false) => {
      const element = root.current; if (!element || !query) return 0;
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const expression = new RegExp(escaped, all ? 'gi' : 'i');
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); let count = 0; let node = walker.nextNode();
      while (node) { const text = node.textContent ?? ''; if (expression.test(text)) { node.textContent = all ? text.replace(expression, replacement) : text.replace(expression, replacement); count += all ? (text.match(expression) ?? []).length : 1; if (!all) break; } node = walker.nextNode(); }
      if (count) sync(); return count;
    },
  }), [execute, insert, find, doc?.html, remember, restore, sync]);
  const paste = (event: ClipboardEvent<HTMLDivElement>): void => { event.preventDefault(); const html = event.clipboardData.getData('text/html'); const text = event.clipboardData.getData('text/plain'); insert(html ? sanitizeHtml(html) : text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char).replace(/\n/g, '<br>')); };
  const keydown = (event: KeyboardEvent<HTMLDivElement>): void => { if (event.key === 'Tab') { event.preventDefault(); execute(event.shiftKey ? 'outdent' : 'indent'); } };
  if (!doc) return null;
  return <div ref={root} className="editor-surface" role="textbox" aria-label={en.editor.content} aria-multiline="true" contentEditable={!readOnly} suppressContentEditableWarning spellCheck={doc.spellcheck} data-testid="writer-editor" data-document-id={documentId} style={{ fontFamily: doc.settings.font, '--paragraph-spacing': `${doc.settings.paragraphSpacing}px`, columnCount: doc.settings.columns, columnGap: doc.settings.columnGap, hyphens: doc.settings.hyphenation ? 'auto' : 'manual' } as CSSProperties} onInput={() => { sync(); }} onKeyUp={remember} onMouseUp={remember} onFocus={remember} onPaste={paste} onKeyDown={keydown} onBlur={() => { remember(); }} />;
});
