import { beforeEach, describe, expect, it } from 'vitest';
import { createWriterStore, writerText } from './store';
let store: ReturnType<typeof createWriterStore>;
beforeEach(() => { store = createWriterStore(); store.getState().ensure('doc', 'Title\n\nBody'); });
describe('writer store', () => {
  it('initializes once and keeps documents isolated', () => {
    const original = store.getState().documents.doc; store.getState().ensure('doc', 'Changed'); expect(store.getState().documents.doc).toBe(original);
    store.getState().ensure('other'); store.getState().update('doc', '<p>Edited</p>'); expect(writerText(store.getState().documents.doc ?? original!)).toBe('Edited'); expect(store.getState().documents.other?.html).toContain('<br>');
  });
  it('supports bounded undo and redo snapshots', () => {
    store.getState().update('doc', '<p>One</p>'); store.getState().update('doc', '<p>Two</p>'); store.getState().undo('doc'); expect(store.getState().documents.doc?.html).toBe('<p>One</p>'); store.getState().redo('doc'); expect(store.getState().documents.doc?.html).toBe('<p>Two</p>');
    store.getState().update('doc', '<p>Three</p>'); expect(store.getState().documents.doc?.future).toEqual([]); store.getState().undo('missing'); store.getState().redo('missing');
  });
  it('configures page settings with history and loads imported snapshots', () => {
    store.getState().configure('doc', { paper: 'a4', columns: 2 }); expect(store.getState().documents.doc?.settings).toMatchObject({ paper: 'a4', columns: 2 });
    store.getState().undo('doc'); expect(store.getState().documents.doc?.settings.paper).toBe('letter');
    store.getState().load('doc', { html: '<p>Imported</p>', settings: { ...store.getState().documents.doc!.settings, paper: 'legal' } }); expect(store.getState().documents.doc?.past).toEqual([]);
  });
  it('tracks editing, selection, spelling and pagination preferences', () => {
    const state = store.getState(); state.setTrackChanges('doc', true); state.setSpellcheck('doc', false); state.selectBlock('doc', 'a'); state.selectShape('doc', 'b'); state.setPagination('doc', 3, 2); state.setFormats('doc', ['bold']); state.setPainter('doc', 'color:red');
    expect(store.getState().documents.doc).toMatchObject({ trackChanges: true, spellcheck: false, selectedBlock: 'a', selectedShape: 'b', pageCount: 3, currentPage: 2, activeFormats: ['bold'], painter: 'color:red' });
  });
  it('adds, resolves and deletes comments', () => {
    const id = store.getState().addComment('doc', 'Clarify this paragraph', 100); store.getState().resolveComment('doc', id); expect(store.getState().documents.doc?.comments[0]?.resolved).toBe(true); store.getState().deleteComment('doc', id); expect(store.getState().documents.doc?.comments).toEqual([]);
  });
  it('accepts and rejects tracked insertions and deletions', () => {
    store.getState().update('doc', '<p><ins data-change="change-1">Added</ins><del data-change="change-2">Removed</del>Keep</p>');
    store.getState().addChange('doc', 'insert', 'Added'); store.getState().addChange('doc', 'delete', 'Removed');
    const changes = store.getState().documents.doc?.changes ?? []; const first = changes[0]?.id ?? ''; const second = changes[1]?.id ?? '';
    store.getState().update('doc', `<p><ins data-change="${first}">Added</ins><del data-change="${second}">Removed</del>Keep</p>`);
    store.getState().resolveChanges('doc', true, first); expect(store.getState().documents.doc?.html).toContain('Added'); expect(store.getState().documents.doc?.html).toContain('<del');
    store.getState().resolveChanges('doc', false); expect(store.getState().documents.doc?.html).not.toContain('Removed'); expect(store.getState().documents.doc?.changes).toEqual([]);
  });
  it('removes closed documents', () => { store.getState().remove('doc'); expect(store.getState().documents.doc).toBeUndefined(); });
});
