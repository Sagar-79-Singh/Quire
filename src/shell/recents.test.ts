import { describe, expect, it } from 'vitest';
import { isRecentDocument, MAX_RECENTS, normalizeRecents } from './recents';
const recent = { id: 'one', title: 'Document', path: '/one.docx', appType: 'writer', templateId: 'blank', modifiedAt: 100 };
describe('recent documents', () => {
  it('accepts a bounded document descriptor', () => { expect(isRecentDocument(recent)).toBe(true); });
  it.each([null, undefined, 4, {}, { ...recent, id: '' }, { ...recent, title: ' ' }, { ...recent, title: 'x'.repeat(261) }, { ...recent, path: '' }, { ...recent, path: 'x'.repeat(4097) }, { ...recent, appType: 'other' }, { ...recent, templateId: 4 }, { ...recent, modifiedAt: NaN }, { ...recent, modifiedAt: -1 }])('rejects invalid descriptor %#', (input) => { expect(isRecentDocument(input)).toBe(false); });
  it('sorts, deduplicates by path and limits to twenty', () => {
    const values = Array.from({ length: 25 }, (_, index) => ({ ...recent, id: String(index), path: `/${index}.docx`, modifiedAt: index }));
    const result = normalizeRecents([...values, { ...recent, modifiedAt: 1000 }]);
    expect(result).toHaveLength(MAX_RECENTS);
    expect(result[0]?.path).toBe('/one.docx');
    expect(result[1]?.modifiedAt).toBe(24);
    expect(normalizeRecents([null, recent])).toEqual([recent]);
  });
});
