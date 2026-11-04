import { dialog, BrowserWindow } from 'electron';
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { dirname, extname } from 'node:path';
import { MAX_DOCUMENT_BYTES } from '../src/shell/protocol';
import type { FilePayload, PrintRequest, SaveRequest, SaveResult } from '../src/shell/protocol';
import type { RecentDocument } from '../src/shell/recents';
import { en } from '../src/i18n/en';

export interface BinaryFS {
  readFile: (path: string) => Promise<Uint8Array>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  size: (path: string) => Promise<number>;
}
export interface FileDialogs {
  open: (options: { properties: ['openFile']; filters: { name: string; extensions: string[] }[] }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  save: (options: { defaultPath?: string; filters: { name: string; extensions: string[] }[] }) => Promise<{ canceled: boolean; filePath?: string }>;
}
export interface PrintWindow {
  loadURL: (url: string) => Promise<void>;
  printToPDF: (options: { printBackground: boolean; preferCSSPageSize: boolean }) => Promise<Uint8Array>;
  print: (options: { silent: boolean; printBackground: boolean }) => Promise<void>;
  destroy: () => void;
}
export interface FileOperationsDependencies {
  getWindow: () => { isDestroyed: () => boolean } | null;
  getRecents: () => Promise<RecentDocument[]>;
  fs?: BinaryFS;
  dialogs?: FileDialogs;
  createPrintWindow?: () => PrintWindow;
}
export interface FileOperations {
  openDocument: (path?: string) => Promise<FilePayload | null>;
  saveDocument: (request: SaveRequest) => Promise<SaveResult | null>;
  exportPdf: (request: PrintRequest) => Promise<SaveResult | null>;
  printDocument: (request: PrintRequest) => Promise<void>;
}
const docxFilter = [{ name: 'Quire document', extensions: ['docx'] }];
const pdfFilter = [{ name: 'PDF', extensions: ['pdf'] }];
const defaultFS: BinaryFS = {
  readFile: async (path) => new Uint8Array(await readFile(path)),
  writeFile: async (path, data) => { await writeFile(path, data); },
  rename: (from, to) => rename(from, to),
  mkdir: async (path) => { await mkdir(path, { recursive: true }); },
  size: async (path) => (await stat(path)).size,
};
const defaultDialogs: FileDialogs = {
  open: (options) => dialog.showOpenDialog(options),
  save: (options) => dialog.showSaveDialog(options),
};
function defaultPrintWindow(): PrintWindow {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: false } });
  return { loadURL: (url) => window.loadURL(url), printToPDF: async (options) => new Uint8Array(await window.webContents.printToPDF(options)), print: (options) => new Promise<void>((resolve, reject) => { window.webContents.print(options, (success, reason) => { if (success) resolve(); else reject(new Error(reason || en.toast.file)); }); }), destroy: () => { if (!window.isDestroyed()) window.destroy(); } };
}
export function createFileOperations(dependencies: FileOperationsDependencies): FileOperations {
  const fs = dependencies.fs ?? defaultFS; const dialogs = dependencies.dialogs ?? defaultDialogs; const makePrintWindow = dependencies.createPrintWindow ?? defaultPrintWindow;
  const allowed = new Set<string>();
  const remember = (path: string): void => { allowed.add(path); };
  const assertAllowed = async (path: string): Promise<void> => {
    if (allowed.has(path)) return;
    const recents = await dependencies.getRecents();
    if (recents.some((recent) => recent.path === path)) { remember(path); return; }
    throw new Error(en.toast.file);
  };
  const safeName = (name: string, extension: string): string => `${name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\.(docx|pdf)$/i, '').slice(0, 200) || en.title.document}.${extension}`;
  const atomicWrite = async (path: string, data: Uint8Array): Promise<void> => { const temporary = `${path}.quire-tmp`; await fs.mkdir(dirname(path)); await fs.writeFile(temporary, data); await fs.rename(temporary, path); remember(path); };
  const withPrintWindow = async <T>(html: string, run: (window: PrintWindow) => Promise<T>): Promise<T> => {
    const window = makePrintWindow();
    try { await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`); return await run(window); }
    finally { window.destroy(); }
  };
  return {
    openDocument: async (path) => {
      let selected = path;
      if (!selected) { const result = await dialogs.open({ properties: ['openFile'], filters: docxFilter }); if (result.canceled || !result.filePaths[0]) return null; selected = result.filePaths[0]; }
      if (typeof selected !== 'string' || extname(selected).toLowerCase() !== '.docx') throw new Error(en.toast.file);
      await assertAllowed(selected);
      const size = await fs.size(selected); if (size > MAX_DOCUMENT_BYTES) throw new Error(en.toast.file);
      const bytes = await fs.readFile(selected); remember(selected);
      const name = selected.split(/[/\\]/).pop() ?? en.title.document;
      return { name, path: selected, data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer };
    },
    saveDocument: async (request) => {
      let target = request.path;
      if (!target) { const result = await dialogs.save({ defaultPath: safeName(request.name, 'docx'), filters: docxFilter }); if (result.canceled || !result.filePath) return null; target = result.filePath; }
      else await assertAllowed(target);
      if (extname(target).toLowerCase() !== '.docx') target += '.docx';
      await atomicWrite(target, new Uint8Array(request.data));
      return { name: target.split(/[/\\]/).pop() ?? safeName(request.name, 'docx'), path: target };
    },
    exportPdf: async (request) => {
      const result = await dialogs.save({ defaultPath: safeName(request.name, 'pdf'), filters: pdfFilter });
      if (result.canceled || !result.filePath) return null;
      const target = extname(result.filePath).toLowerCase() === '.pdf' ? result.filePath : `${result.filePath}.pdf`;
      const bytes = await withPrintWindow(request.html, (window) => window.printToPDF({ printBackground: true, preferCSSPageSize: true }));
      await atomicWrite(target, bytes);
      return { name: target.split(/[/\\]/).pop() ?? safeName(request.name, 'pdf'), path: target };
    },
    printDocument: async (request) => { await withPrintWindow(request.html, (window) => window.print({ silent: false, printBackground: true })); },
  };
}
