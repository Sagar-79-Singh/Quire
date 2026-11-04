import { describe, expect, it, vi } from 'vitest';
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { createMainWindow } from './window';
import { registerShellIPC } from './ipc';
import { bootstrap } from './main';
const mocks = vi.hoisted(() => ({
  window: { on: vi.fn(), webContents: { send: vi.fn() } },
  events: new Map<string, () => void>(),
  unregister: vi.fn(),
  menu: vi.fn((items: unknown) => items),
}));
vi.mock('electron', () => ({
  app: { whenReady: vi.fn().mockResolvedValue(undefined), setName: vi.fn(), getPath: vi.fn(() => '/data'), on: vi.fn((name: string, listener: () => void) => { mocks.events.set(name, listener); }), quit: vi.fn() },
  BrowserWindow: { fromWebContents: vi.fn(), getAllWindows: vi.fn(() => []) },
  Menu: { setApplicationMenu: vi.fn(), buildFromTemplate: mocks.menu }, dialog: { showErrorBox: vi.fn(), showOpenDialog: vi.fn(), showSaveDialog: vi.fn() }, ipcMain: { handle: vi.fn(), removeHandler: vi.fn() },
}));
vi.mock('./window', () => ({ createMainWindow: vi.fn(() => mocks.window) }));
vi.mock('./ipc', () => ({ registerShellIPC: vi.fn(() => mocks.unregister) }));
describe('desktop bootstrap', () => {
  it('wires the secure window, IPC, menu and lifecycle events', async () => {
    await bootstrap();
    expect(app.setName).toHaveBeenCalledWith('Quire'); expect(createMainWindow).toHaveBeenCalled();
    expect(registerShellIPC).toHaveBeenCalledWith(expect.objectContaining({ ipcMain, dataDirectory: '/data' })); expect(Menu.setApplicationMenu).toHaveBeenCalled();
    mocks.events.get('closed')?.();
    mocks.events.get('activate')?.(); expect(createMainWindow).toHaveBeenCalledTimes(2);
    mocks.events.get('window-all-closed')?.();
    mocks.events.get('will-quit')?.(); expect(mocks.unregister).toHaveBeenCalled();
    const template = mocks.menu.mock.calls[0]?.[0] as Array<{ submenu?: Array<{ click?: () => void }> }>;
    template.flatMap((item) => item.submenu ?? []).find((item) => item.click)?.click?.(); expect(mocks.window.webContents.send).toHaveBeenCalled();
    const deps = vi.mocked(registerShellIPC).mock.calls[0]?.[0]; expect(deps?.isTrustedSender({ sender: {} } as never)).toBe(false);
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mocks.window as never); expect(deps?.isTrustedSender({ sender: {} } as never)).toBe(true);
  });
});
