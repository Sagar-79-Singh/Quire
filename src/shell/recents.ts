import type { AppType } from './store';
export interface RecentDocument { id: string; title: string; path: string; appType: AppType; templateId: string; modifiedAt: number; thumbnail?: string; }
export const MAX_RECENTS = 20;
export function isRecentDocument(value: unknown): value is RecentDocument {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 100 &&
    typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 260 &&
    typeof item.path === 'string' && item.path.length > 0 && item.path.length <= 4096 &&
    typeof item.templateId === 'string' && item.templateId.length <= 100 &&
    (item.appType === 'writer' || item.appType === 'sheets' || item.appType === 'slides') &&
    typeof item.modifiedAt === 'number' && Number.isFinite(item.modifiedAt) && item.modifiedAt >= 0 && (item.thumbnail === undefined || typeof item.thumbnail === 'string' && item.thumbnail.length <= 20000 && /^data:image\/svg\+xml/.test(item.thumbnail));
}
export function normalizeRecents(values: readonly unknown[]): RecentDocument[] {
  const seen = new Set<string>();
  return values.filter(isRecentDocument).filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  }).sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, MAX_RECENTS);
}
