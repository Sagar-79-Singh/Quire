import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import * as fontList from 'font-list';
import { normalizeRecents } from '../src/shell/recents';
import type { RecentDocument } from '../src/shell/recents';
import type { WindowAction } from '../src/shell/protocol';
import { IPC, isPrintRequest, isSaveRequest, isWindowAction } from '../src/shell/protocol';
import type { FileOperations } from './files';
import { en } from '../src/i18n/en';

export interface ShellWindow {
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  isMaximized: () => boolean;
  close: () => void;
  setFullScreen: (value: boolean) => void;
  isFullScreen: () => boolean;
}
export interface PersistenceFS {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, value: string) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
}
export interface IPCDependencies {
  ipcMain: Pick<IpcMain, 'handle' | 'removeHandler'>;
  getWindow: () => ShellWindow | null;
  dataDirectory: string;
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean;
  fs?: PersistenceFS;
  fileOperations?: FileOperations;
}
const defaultFS: PersistenceFS = {
  readFile: (path) => readFile(path, 'utf8'),
  writeFile: (path, value) => writeFile(path, value, 'utf8'),
  rename: (from, to) => rename(from, to),
  mkdir: (path) => mkdir(path, { recursive: true }).then(() => undefined),
};
export function registerShellIPC(dependencies: IPCDependencies): () => void {
  const { ipcMain, getWindow, dataDirectory, isTrustedSender, fs = defaultFS } = dependencies;
  const path = join(dataDirectory, 'recents.json');
  const guard = (event: IpcMainInvokeEvent): ShellWindow => {
    if (!isTrustedSender(event)) throw new Error(en.toast.error);
    const window = getWindow();
    if (!window) throw new Error(en.toast.window);
    return window;
  };
  ipcMain.handle(IPC.getSystemFonts, async (event): Promise<string[]> => {
    guard(event);
    const fonts = await fontList.getFonts({ disableQuoting: true });
    const unique = new Map<string, string>();
    for (const raw of fonts) {
      const font = raw.trim().replace(/^"(.+)"$/, '$1').trim();
      const key = font.toLocaleLowerCase('en-US');
      if (font && !unique.has(key)) unique.set(key, font);
    }
    return Array.from(unique.values()).sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
  });
  ipcMain.handle(IPC.getRecents, async (event): Promise<RecentDocument[]> => {
    guard(event);
    try { const parsed: unknown = JSON.parse(await fs.readFile(path)); return Array.isArray(parsed) ? normalizeRecents(parsed) : []; }
    catch (error) { if ((error !== null && typeof error === 'object' && 'code' in error ? error.code : undefined) === 'ENOENT') return []; throw error; }
  });
  ipcMain.handle(IPC.setRecents, async (event, value: unknown): Promise<void> => {
    guard(event);
    if (!Array.isArray(value) || value.length > 1000) throw new TypeError(en.toast.recentSave);
    const temporary = `${path}.tmp`;
    await fs.mkdir(dirname(path));
    await fs.writeFile(temporary, JSON.stringify(normalizeRecents(value)));
    await fs.rename(temporary, path);
  });
  if (dependencies.fileOperations) {
    const files = dependencies.fileOperations;
    ipcMain.handle(IPC.openDocument, async (event, value: unknown) => { guard(event); if (value !== undefined && (typeof value !== 'string' || value.length > 4096)) throw new TypeError(en.toast.file); return files.openDocument(value); });
    ipcMain.handle(IPC.saveDocument, async (event, value: unknown) => { guard(event); if (!isSaveRequest(value)) throw new TypeError(en.toast.file); return files.saveDocument(value); });
    ipcMain.handle(IPC.exportPdf, async (event, value: unknown) => { guard(event); if (!isPrintRequest(value)) throw new TypeError(en.toast.pdf); return files.exportPdf(value); });
    ipcMain.handle(IPC.printDocument, async (event, value: unknown) => { guard(event); if (!isPrintRequest(value)) throw new TypeError(en.toast.file); return files.printDocument(value); });
  }
  ipcMain.handle(IPC.windowControl, (event, value: unknown): void => {
    const window = guard(event);
    if (!isWindowAction(value)) throw new TypeError(en.toast.window);
    if (value === 'minimize') window.minimize();
    else if (value === 'maximize') { if (window.isMaximized()) window.unmaximize(); else window.maximize(); }
    else window.close();
  });
  ipcMain.handle(IPC.fullscreen, (event): void => { const window = guard(event); window.setFullScreen(!window.isFullScreen()); });
  return () => { Object.values(IPC).filter((channel) => channel !== IPC.menuAction).forEach((channel) => { ipcMain.removeHandler(channel); }); };
}
export type { WindowAction };
