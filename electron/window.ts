import { BrowserWindow, dialog } from 'electron';
import { en } from '../src/i18n/en';
export interface WindowOptions { preloadPath: string; rendererUrl?: string; indexPath: string; platform: string; }
export function createMainWindow(options: WindowOptions): BrowserWindow {
  const mac = options.platform === 'darwin';
  const window = new BrowserWindow({
    width: 1440, height: 940, minWidth: 760, minHeight: 540,
    title: en.app.name, backgroundColor: '#F3F2F1', show: false,
    frame: false, titleBarStyle: mac ? 'hiddenInset' : 'hidden',
    ...(mac ? { trafficLightPosition: { x: 12, y: 9 } } : {}),
    webPreferences: { preload: options.preloadPath, sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, spellcheck: true },
  });
  window.once('ready-to-show', () => { window.show(); });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => { event.preventDefault(); });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => { callback(false); });
  if (options.rendererUrl) void window.loadURL(options.rendererUrl).catch(() => { dialog.showErrorBox(en.app.name, en.toast.error); window.close(); });
  else void window.loadFile(options.indexPath).catch(() => { dialog.showErrorBox(en.app.name, en.toast.error); window.close(); });
  return window;
}
