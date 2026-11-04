import { describe, expect, it } from 'vitest';
import { paginateBlocks } from './pagination';
const block = (id: string, height: number) => ({ id, height, marginBefore: 0, marginAfter: 0 });
describe('pagination', () => {
  it('keeps short content on one page', () => { expect(paginateBlocks([block('a', 100), block('b', 200)], 800)).toMatchObject({ pageCount: 1, breaks: [] }); expect(paginateBlocks([], 800).pageCount).toBe(1); });
  it('moves overflow to the next page with a real gap', () => { const result = paginateBlocks([block('a', 500), block('b', 400), block('c', 100)], 800); expect(result.pageCount).toBe(2); expect(result.breaks[0]).toEqual({ beforeId: 'b', extraSpace: 324 }); expect(result.pageById.c).toBe(2); });
  it('honors explicit breaks and oversized blocks', () => { expect(paginateBlocks([{ ...block('a', 100), breakBefore: true }], 800).pageCount).toBe(1); expect(paginateBlocks([block('a', 100), { ...block('b', 100), breakBefore: true }], 800).pageCount).toBe(2); expect(paginateBlocks([block('a', 1700)], 800).pageCount).toBe(3); });
});
