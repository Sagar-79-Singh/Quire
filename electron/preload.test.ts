import { describe, expect, it, vi } from 'vitest';
import type { IpcRendererEvent } from 'electron';
import { contextBridge, ipcRenderer } from 'electron';
import { createBridge, installPreload } from './preload';
import { IPC } from '../src/shell/protocol';
vi.mock('electron', () => ({ contextBridge: { exposeInMainWorld: vi.fn() }, ipcRenderer: { invoke: vi.fn().mockResolvedValue(undefined), on: vi.fn(), removeListener: vi.fn() } }));
describe('preload bridge', () => {
  it('registers only the typed whitelisted API', () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('quire', expect.objectContaining({ getRecents: expect.any(Function), setRecents: expect.any(Function) }));
    installPreload(); expect(contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1);
    const bridge = createBridge(ipcRenderer, 'linux'); expect(bridge.platform).toBe('linux'); expect(Object.keys(bridge).sort()).toEqual(['getRecents', 'onMenuAction', 'platform', 'setRecents', 'toggleFullscreen', 'windowControl']);
  });
  it('delegates fixed channels and validates native menu messages', async () => {
    const bridge = createBridge(ipcRenderer, 'linux'); const recent = { id: 'r', title: 'Document', path: '/file.docx', appType: 'writer' as const, templateId: 'blank', modifiedAt: 100 };
    await bridge.getRecents(); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.getRecents); await bridge.setRecents([recent]); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.setRecents, [recent]);
    await bridge.windowControl('minimize'); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.windowControl, 'minimize'); await bridge.toggleFullscreen(); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.fullscreen);
    const listener = vi.fn(); const unsubscribe = bridge.onMenuAction(listener); const registered = vi.mocked(ipcRenderer.on).mock.calls[0]?.[1]; registered?.({} as IpcRendererEvent, 'new'); registered?.({} as IpcRendererEvent, 'invalid'); expect(listener).toHaveBeenCalledOnce(); expect(listener).toHaveBeenCalledWith('new'); unsubscribe(); expect(ipcRenderer.removeListener).toHaveBeenCalledWith(IPC.menuAction, registered);
  });
});
