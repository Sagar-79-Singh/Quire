import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { registerShellIPC } from './ipc';
import { IPC } from '../src/shell/protocol';
import { createMainWindow } from './window';
import { createMenuTemplate } from './menu';

export async function bootstrap(): Promise<void> {
  await app.whenReady();
  app.setName(en.app.name);
  let window: BrowserWindow | null = null;
  const create = (): void => {
    window = createMainWindow({ preloadPath: fileURLToPath(new URL('../preload/index.cjs', import.meta.url)), indexPath: fileURLToPath(new URL('../../dist/index.html', import.meta.url)), rendererUrl: process.env.ELECTRON_RENDERER_URL, platform: process.platform });
    window.on('closed', () => { window = null; });
  };
  const unregister = registerShellIPC({ ipcMain, getWindow: () => window, dataDirectory: app.getPath('userData'), isTrustedSender: (event) => Boolean(window && BrowserWindow.fromWebContents(event.sender) === window) });
  create();
  Menu.setApplicationMenu(Menu.buildFromTemplate(createMenuTemplate((action) => { window?.webContents.send(IPC.menuAction, action); }, process.platform === 'darwin')));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) create(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('will-quit', () => { unregister(); });
}