import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { QuireBridge } from '../src/shell/io';
import { isMenuAction } from '../src/shell/shortcuts';
import { IPC } from '../src/shell/protocol';

export function createBridge(renderer: Pick<typeof ipcRenderer, 'invoke' | 'on' | 'removeListener'>, platform: string): QuireBridge {
  return {
    platform,
    getRecents: () => renderer.invoke(IPC.getRecents),
    setRecents: (documents) => renderer.invoke(IPC.setRecents, documents),
    windowControl: (action) => renderer.invoke(IPC.windowControl, action),
    toggleFullscreen: () => renderer.invoke(IPC.fullscreen),
    onMenuAction: (listener) => {
      const wrapped = (_event: IpcRendererEvent, value: unknown): void => { if (isMenuAction(value)) listener(value); };
      renderer.on(IPC.menuAction, wrapped);
      return () => { renderer.removeListener(IPC.menuAction, wrapped); };
    },
  };
}
export function installPreload(): void {
  contextBridge.exposeInMainWorld('quire', createBridge(ipcRenderer, process.platform));
}
