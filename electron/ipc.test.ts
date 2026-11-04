import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IpcMainInvokeEvent } from 'electron';
import { registerShellIPC } from './ipc';
import type { PersistenceFS, ShellWindow } from './ipc';
import { IPC } from '../src/shell/protocol';
const fsMocks = vi.hoisted(() => ({
  readFile: vi.fn((_path: string, _encoding: string) => Promise.resolve('[]')),
  writeFile: vi.fn((_path: string, _value: string, _encoding: string) => Promise.resolve()),
  rename: vi.fn((_from: string, _to: string) => Promise.resolve()),
  mkdir: vi.fn((_path: string, _options: { recursive: boolean }) => Promise.resolve(undefined)),
}));
vi.mock('node:fs/promises', () => ({ ...fsMocks, default: fsMocks }));
type Handler = (event: IpcMainInvokeEvent, value?: unknown) => unknown;
const event = {} as IpcMainInvokeEvent;
const recent = { id: 'r', title: 'Document', path: '/document.docx', appType: 'writer', templateId: 'blank', modifiedAt: 100 };
let handlers: Map<string, Handler>;
let window: ShellWindow;
let fs: PersistenceFS;
let trusted: boolean;
let available: boolean;
const ipcMain = { handle: vi.fn((channel: string, handler: Handler) => { handlers.set(channel, handler); }), removeHandler: vi.fn((channel: string) => { handlers.delete(channel); }) };
function register(injectedFS: PersistenceFS | undefined = fs) { return registerShellIPC({ ipcMain, getWindow: () => available ? window : null, dataDirectory: '/data', isTrustedSender: () => trusted, fs: injectedFS }); }
function invoke(channel: string, value?: unknown): unknown { const handler = handlers.get(channel); if (!handler) throw new Error('Missing handler'); return handler(event, value); }
beforeEach(() => {
  handlers = new Map(); trusted = true; available = true;
  window = { minimize: vi.fn(), maximize: vi.fn(), unmaximize: vi.fn(), isMaximized: vi.fn(() => false), close: vi.fn(), setFullScreen: vi.fn(), isFullScreen: vi.fn(() => false) };
  fs = { readFile: vi.fn().mockResolvedValue(JSON.stringify([recent])), writeFile: vi.fn().mockResolvedValue(undefined), rename: vi.fn().mockResolvedValue(undefined), mkdir: vi.fn().mockResolvedValue(undefined) };
});
describe('shell IPC', () => {
  it('reads validated recents and writes atomically', async () => {
    const unregister = register(); await expect(invoke(IPC.getRecents)).resolves.toEqual([recent]);
    await invoke(IPC.setRecents, [recent]); expect(fs.mkdir).toHaveBeenCalledWith('/data'); expect(fs.writeFile).toHaveBeenCalledWith('/data/recents.json.tmp', JSON.stringify([recent])); expect(fs.rename).toHaveBeenCalledWith('/data/recents.json.tmp', '/data/recents.json');
    unregister(); expect(handlers.size).toBe(0);
  });
  it('handles a first launch and rejects corrupt persisted data', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(Object.assign(new Error('Missing'), { code: 'ENOENT' })); register(); await expect(invoke(IPC.getRecents)).resolves.toEqual([]);
    vi.mocked(fs.readFile).mockResolvedValue('{}'); await expect(invoke(IPC.getRecents)).resolves.toEqual([]);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('Denied')); await expect(invoke(IPC.getRecents)).rejects.toThrow('Denied');
  });
  it('guards sender identity, window lifetime and payload shape', async () => {
    register(); trusted = false; expect(() => invoke(IPC.windowControl, 'close')).toThrow();
    trusted = true; available = false; expect(() => invoke(IPC.fullscreen)).toThrow(); available = true;
    expect(() => invoke(IPC.windowControl, 'delete-files')).toThrow(); await expect(invoke(IPC.setRecents, {})).rejects.toThrow(); await expect(invoke(IPC.setRecents, Array(1001))).rejects.toThrow();
  });
  it('maps all window controls and toggles fullscreen', () => {
    register(); invoke(IPC.windowControl, 'minimize'); expect(window.minimize).toHaveBeenCalled();
    invoke(IPC.windowControl, 'maximize'); expect(window.maximize).toHaveBeenCalled();
    vi.mocked(window.isMaximized).mockReturnValue(true); invoke(IPC.windowControl, 'maximize'); expect(window.unmaximize).toHaveBeenCalled();
    invoke(IPC.windowControl, 'close'); expect(window.close).toHaveBeenCalled(); invoke(IPC.fullscreen); expect(window.setFullScreen).toHaveBeenCalledWith(true);
  });
  it('uses the default filesystem adapter without exposing arbitrary paths', async () => {
    fsMocks.readFile.mockResolvedValue('[]'); fsMocks.mkdir.mockResolvedValue(undefined); fsMocks.writeFile.mockResolvedValue(); fsMocks.rename.mockResolvedValue();
    register(undefined); await expect(invoke(IPC.getRecents)).resolves.toEqual([]); await invoke(IPC.setRecents, []);
    expect(fsMocks.readFile).toHaveBeenCalledWith('/data/recents.json', 'utf8'); expect(fsMocks.mkdir).toHaveBeenCalledWith('/data', { recursive: true }); expect(fsMocks.writeFile).toHaveBeenCalledWith('/data/recents.json.tmp', '[]', 'utf8'); expect(fsMocks.rename).toHaveBeenCalled();
  });
});
