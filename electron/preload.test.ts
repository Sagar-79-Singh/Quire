import { describe, expect, it, vi } from 'vitest';
import type { IpcRendererEvent } from 'electron';
import { contextBridge, ipcRenderer } from 'electron';
import { createBridge, installPreload } from './preload';
import { IPC } from '../src/shell/protocol';
vi.mock('electron', () => ({ contextBridge: { exposeInMainWorld: vi.fn() }, ipcRenderer: { invoke: vi.fn().mockResolvedValue(undefined), on: vi.fn(), removeListener: vi.fn() } }));
describe('preload bridge', () => {
  it('registers only the typed whitelisted API', () => {
    installPreload(); expect(contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1); expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('quire', expect.objectContaining({ getSystemFonts: expect.any(Function), getRecents: expect.any(Function), setRecents: expect.any(Function) }));
    const bridge = createBridge(ipcRenderer, 'linux'); expect(bridge.platform).toBe('linux'); expect(Object.keys(bridge).sort()).toEqual(['exportPdf', 'getRecents', 'getSystemFonts', 'onMenuAction', 'openDocument', 'platform', 'printDocument', 'saveDocument', 'setRecents', 'toggleFullscreen', 'windowControl']);
  });
  it('delegates fixed channels and validates native menu messages', async () => {
    const bridge = createBridge(ipcRenderer, 'linux'); const recent = { id: 'r', title: 'Document', path: '/file.docx', appType: 'writer' as const, templateId: 'blank', modifiedAt: 100 };
    await bridge.getSystemFonts(); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.getSystemFonts);
    await bridge.getRecents(); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.getRecents); await bridge.setRecents([recent]); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.setRecents, [recent]);
    await bridge.windowControl('minimize'); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.windowControl, 'minimize'); await bridge.toggleFullscreen(); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.fullscreen);
    await bridge.openDocument('/tmp/a.docx'); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.openDocument, '/tmp/a.docx'); await bridge.saveDocument({ name: 'a', path: null, data: new ArrayBuffer(0) }); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.saveDocument, expect.any(Object)); await bridge.exportPdf({ name: 'a', html: '<html />' }); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.exportPdf, expect.any(Object)); await bridge.printDocument({ name: 'a', html: '<html />' }); expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC.printDocument, expect.any(Object));
    const listener = vi.fn(); const unsubscribe = bridge.onMenuAction(listener); const registered = vi.mocked(ipcRenderer.on).mock.calls[0]?.[1]; registered?.({} as IpcRendererEvent, 'new'); registered?.({} as IpcRendererEvent, 'invalid'); expect(listener).toHaveBeenCalledOnce(); expect(listener).toHaveBeenCalledWith('new'); unsubscribe(); expect(ipcRenderer.removeListener).toHaveBeenCalledWith(IPC.menuAction, registered);
  });
});
