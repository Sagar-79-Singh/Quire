import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserWindow, dialog } from 'electron';
import { createMainWindow } from './window';
const mocks = vi.hoisted(() => {
  const window = { once: vi.fn(), show: vi.fn(), close: vi.fn(), loadURL: vi.fn().mockResolvedValue(undefined), loadFile: vi.fn().mockResolvedValue(undefined), webContents: { setWindowOpenHandler: vi.fn(), on: vi.fn(), session: { setPermissionRequestHandler: vi.fn() } } };
  return { window, Constructor: vi.fn(function () { return window; }) };
});
vi.mock('electron', () => ({ BrowserWindow: mocks.Constructor, dialog: { showErrorBox: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); mocks.window.loadURL.mockResolvedValue(undefined); mocks.window.loadFile.mockResolvedValue(undefined); });
describe('main window', () => {
  it('creates a sandboxed frameless window and loads the renderer', () => {
    const window = createMainWindow({ preloadPath: '/preload.cjs', indexPath: '/index.html', platform: 'linux', rendererUrl: 'http://localhost:5173' });
    expect(BrowserWindow).toHaveBeenCalledWith(expect.objectContaining({ frame: false, webPreferences: expect.objectContaining({ sandbox: true, contextIsolation: true, nodeIntegration: false }) }));
    expect(window.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    const ready = mocks.window.once.mock.calls[0]?.[1] as unknown as () => void; ready(); expect(window.show).toHaveBeenCalled();
    const deny = mocks.window.webContents.setWindowOpenHandler.mock.calls[0]?.[0] as unknown as () => unknown; expect(deny()).toEqual({ action: 'deny' });
    const navigation = mocks.window.webContents.on.mock.calls[0]?.[1] as unknown as (event: { preventDefault: () => void }) => void; const preventDefault = vi.fn(); navigation({ preventDefault }); expect(preventDefault).toHaveBeenCalled();
    const permissions = mocks.window.webContents.session.setPermissionRequestHandler.mock.calls[0]?.[2] as unknown as (allowed: boolean) => void; permissions(false);
  });
  it('loads packaged files and reserves space for native controls', () => {
    createMainWindow({ preloadPath: '/preload.cjs', indexPath: '/index.html', platform: 'darwin' }); expect(mocks.window.loadFile).toHaveBeenCalledWith('/index.html'); expect(BrowserWindow).toHaveBeenCalledWith(expect.objectContaining({ titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 12, y: 9 } }));
  });
  it('reports load failures instead of leaving a broken invisible window', async () => {
    mocks.window.loadFile.mockRejectedValue(new Error('Missing')); createMainWindow({ preloadPath: '/preload.cjs', indexPath: '/missing.html', platform: 'win32' });
    await vi.waitFor(() => { expect(dialog.showErrorBox).toHaveBeenCalled(); }); expect(mocks.window.close).toHaveBeenCalled();
    mocks.window.loadURL.mockRejectedValue(new Error('Missing')); createMainWindow({ preloadPath: '/preload.cjs', indexPath: '/index.html', platform: 'linux', rendererUrl: 'http://localhost:5173' }); await vi.waitFor(() => { expect(mocks.window.close).toHaveBeenCalledTimes(2); });
  });
});
