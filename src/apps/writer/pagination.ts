export interface BlockMeasurement { id: string; height: number; marginBefore: number; marginAfter: number; breakBefore?: boolean; }
export interface PageBreak { beforeId: string; extraSpace: number; }
export interface PaginationResult { pageCount: number; breaks: PageBreak[]; pageById: Record<string, number>; }
export function paginateBlocks(blocks: BlockMeasurement[], capacity: number, pageGap = 24): PaginationResult {
  let page = 1; let used = 0; const breaks: PageBreak[] = []; const pageById: Record<string, number> = {};
  for (const block of blocks) {
    const height = Math.max(1, block.height + block.marginBefore + block.marginAfter);
    if (used > 0 && (block.breakBefore || used + height > capacity)) {
      breaks.push({ beforeId: block.id, extraSpace: Math.max(0, capacity - used) + pageGap + block.marginBefore + block.marginAfter });
      page += 1; used = 0;
    }
    pageById[block.id] = page;
    used += height;
    while (used > capacity) { page += 1; used -= capacity; }
  }
  return { pageCount: Math.max(page, Math.ceil(used / Math.max(1, capacity)), 1), breaks, pageById };
}
