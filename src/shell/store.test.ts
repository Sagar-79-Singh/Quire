import { describe, expect, it } from 'vitest';
import { clampZoom, countWords, createShellStore, getActiveDocument } from './store';

const setup = () => {
  let id = 0;
  return createShellStore(() => 100, () => `document-${++id}`);
};
describe('shell store', () => {
  it('marks a saved document clean without touching other tabs', () => {
    const store = createShellStore(() => 100, () => 'doc'); store.getState().openDocument({ title: 'Draft' }); store.getState().setDocumentContent('doc', 'Edited'); store.getState().markSaved('doc', '/tmp/draft.docx', 'Draft');
    expect(store.getState().tabs[0]).toMatchObject({ path: '/tmp/draft.docx', title: 'Draft', dirty: false }); store.getState().markSaved('missing', '/x'); expect(store.getState().tabs).toHaveLength(1);
  });

  it('opens, activates, renames and edits isolated documents', () => {
    const store = setup();
    const first = store.getState().openDocument({ title: '  First  ', content: 'Original' });
    const second = store.getState().openDocument({ title: 'Second', templateId: 'notes' });
    expect(first).toBe('document-1');
    expect(getActiveDocument(store.getState())?.title).toBe('Second');
    store.getState().activateDocument(first);
    store.getState().renameDocument(first, '  Renamed  ');
    store.getState().setDocumentContent(first, 'Changed');
    expect(store.getState().tabs[0]).toMatchObject({ title: 'Renamed', content: 'Changed', dirty: true, createdAt: 100 });
    expect(store.getState().tabs[1]).toMatchObject({ id: second, content: '', templateId: 'notes', dirty: false });
    store.getState().renameDocument(first, '   ');
    expect(store.getState().tabs[0]?.title).toBe('Renamed');
    store.getState().activateDocument('missing');
    expect(store.getState().activeId).toBe(first);
  });
  it('selects a neighbor on close and returns home after the last tab', () => {
    const store = setup();
    const a = store.getState().openDocument({ title: 'A' });
    const b = store.getState().openDocument({ title: 'B' });
    const c = store.getState().openDocument({ title: 'C' });
    store.getState().closeDocument(b);
    expect(store.getState().activeId).toBe(c);
    store.getState().activateDocument(a);
    store.getState().closeDocument(b);
    expect(store.getState().activeId).toBe(a);
    store.getState().closeDocument(a);
    store.getState().closeDocument(c);
    expect(store.getState()).toMatchObject({ activeId: null, tabs: [] });
    store.getState().cycleDocument(1);
    expect(store.getState().activeId).toBeNull();
  });
  it('cycles in both directions, including from home', () => {
    const store = setup();
    const a = store.getState().openDocument({ title: 'A' });
    const b = store.getState().openDocument({ title: 'B' });
    store.getState().cycleDocument(1);
    expect(store.getState().activeId).toBe(a);
    store.getState().cycleDocument(-1);
    expect(store.getState().activeId).toBe(b);
    store.getState().activateDocument(null);
    store.getState().cycleDocument(1);
    expect(store.getState().activeId).toBe(b);
  });
  it('normalizes names and preserves a supplied path', () => {
    const store = setup();
    store.getState().openDocument({ title: '   ', path: '/tmp/file.docx' });
    expect(getActiveDocument(store.getState())).toMatchObject({ title: 'Untitled document', path: '/tmp/file.docx', appType: 'writer' });
    store.getState().openDocument({ title: 'x'.repeat(300) });
    expect(getActiveDocument(store.getState())?.title).toHaveLength(260);
  });
  it('updates all shell preferences and clamps zoom', () => {
    const store = setup();
    const state = store.getState();
    state.setTheme('dark'); state.setAutoSave(true); state.setRibbonMode('expanded');
    state.setPanelTab('comments'); state.setViewMode('web'); state.setBackstageOpen(true); state.setZoom(125);
    expect(store.getState()).toMatchObject({ theme: 'dark', autoSave: true, ribbonMode: 'expanded', panelOpen: true, panelTab: 'comments', viewMode: 'web', backstageOpen: true, zoom: 125 });
    state.setPanelOpen(false);
    expect(store.getState().panelOpen).toBe(false);
    state.setZoom(500); expect(store.getState().zoom).toBe(400);
    state.setZoom(0); expect(store.getState().zoom).toBe(25);
  });
  it('adds, replaces and removes recents without changing files', () => {
    const store = setup();
    const recent = { id: 'r', title: 'Notes', path: '/notes.docx', appType: 'writer' as const, templateId: 'notes', modifiedAt: 100 };
    store.getState().addRecent(recent);
    store.getState().addRecent({ ...recent, modifiedAt: 200 });
    expect(store.getState().recents).toHaveLength(1);
    expect(store.getState().recents[0]?.modifiedAt).toBe(200);
    store.getState().removeRecent('r');
    expect(store.getState().recents).toEqual([]);
    store.getState().replaceRecents([recent]);
    expect(store.getState().recents).toEqual([recent]);
  });
  it.each([[Infinity, 100], [NaN, 100], [125.6, 126], [-1, 25], [500, 400]])('clamps zoom %s', (input, expected) => { expect(clampZoom(input)).toBe(expected); });
  it('counts words without counting surrounding whitespace', () => { expect(countWords('  One two\nthree  ')).toBe(3); expect(countWords(' \n ')).toBe(0); });
});
