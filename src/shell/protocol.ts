export const IPC = {
  getRecents: 'quire:get-recents',
  setRecents: 'quire:set-recents',
  windowControl: 'quire:window-control',
  fullscreen: 'quire:fullscreen',
  menuAction: 'quire:menu-action',
  openDocument: 'quire:open-document',
  saveDocument: 'quire:save-document',
  exportPdf: 'quire:export-pdf',
  printDocument: 'quire:print-document',
} as const;
export type WindowAction = 'minimize' | 'maximize' | 'close';
export function isWindowAction(value: unknown): value is WindowAction {
  return value === 'minimize' || value === 'maximize' || value === 'close';
}

export interface FilePayload { name: string; path: string | null; data: ArrayBuffer; }
export interface SaveRequest { name: string; path: string | null; data: ArrayBuffer; }
export interface SaveResult { name: string; path: string; }
export interface PrintRequest { name: string; html: string; }
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
export function isSaveRequest(value: unknown): value is SaveRequest {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 260 && (item.path === null || typeof item.path === 'string' && item.path.length <= 4096) && item.data instanceof ArrayBuffer && item.data.byteLength <= MAX_DOCUMENT_BYTES;
}
export function isPrintRequest(value: unknown): value is PrintRequest {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 260 && typeof item.html === 'string' && item.html.length <= MAX_DOCUMENT_BYTES;
}
