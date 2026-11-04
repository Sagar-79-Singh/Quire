import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { registerShellIPC } from './ipc';
import { IPC } from '../src/shell/protocol';
import { createMainWindow } from './window';
import { createFileOperations } from './files';
import { normalizeRecents } from '../src/shell/recents';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { en } from '../src/i18n/en';
import { createMenuTemplate } from './menu';

export async function bootstrap(): Promise<void> {
  await app.whenReady();
  app.setName(en.app.name);
  let window: BrowserWindow | null = null;
  const create = (): void => {
    window = createMainWindow({ preloadPath: fileURLToPath(new URL('../preload/index.cjs', import.meta.url)), indexPath: fileURLToPath(new URL('../../dist/index.html', import.meta.url)), rendererUrl: process.env.ELECTRON_RENDERER_URL, platform: process.platform });
    window.on('closed', () => { window = null; });
  };
  const dataDirectory = app.getPath('userData');
  const getRecents = async () => { try { const parsed: unknown = JSON.parse(await readFile(join(dataDirectory, 'recents.json'), 'utf8')); return Array.isArray(parsed) ? normalizeRecents(parsed) : []; } catch { return []; } };
  const fileOperations = createFileOperations({ getWindow: () => window, getRecents });
  const unregister = registerShellIPC({ ipcMain, getWindow: () => window, dataDirectory, fileOperations, isTrustedSender: (event) => Boolean(window && BrowserWindow.fromWebContents(event.sender) === window) });
  create();
  Menu.setApplicationMenu(Menu.buildFromTemplate(createMenuTemplate((action) => { window?.webContents.send(IPC.menuAction, action); }, process.platform === 'darwin')));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) create(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('will-quit', () => { unregister(); });
}