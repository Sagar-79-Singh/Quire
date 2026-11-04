import { describe, expect, it, vi } from 'vitest';
import { createShellIO, RECENTS_KEY } from './io';
import type { QuireBridge } from './io';
const recent = { id: 'r', title: 'Notes', path: '/notes.docx', appType: 'writer' as const, templateId: 'notes', modifiedAt: 100 };
function setup(bridge?: QuireBridge) {
  const values = new Map<string, string>();
  const onError = vi.fn();
  const io = createShellIO({ getBridge: () => bridge, storage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } }, onError });
  return { io, values, onError };
}
describe('shell IO', () => {
  it('persists normalized recents in injectable browser storage', async () => {
    const { io, values } = setup();
    expect(io.isDesktop).toBe(false); expect(io.platform).toBe('browser');
    await expect(io.loadRecents()).resolves.toEqual([]);
    await expect(io.saveRecents([recent])).resolves.toBe(true);
    expect(JSON.parse(values.get(RECENTS_KEY) ?? '[]')).toEqual([recent]);
    await expect(io.loadRecents()).resolves.toEqual([recent]);
    await io.windowControl('close'); await io.toggleFullscreen(); io.onMenuAction(vi.fn())();
  });
  it('reports malformed storage without throwing', async () => {
    const { io, values, onError } = setup(); values.set(RECENTS_KEY, '{');
    await expect(io.loadRecents()).resolves.toEqual([]); expect(onError).toHaveBeenCalledOnce();
  });
  it('reports storage write failures', async () => {
    const onError = vi.fn();
    const io = createShellIO({ getBridge: () => undefined, storage: { getItem: () => null, setItem: () => { throw new Error('quota'); } }, onError });
    await expect(io.saveRecents([])).resolves.toBe(false); expect(onError).toHaveBeenCalledOnce();
  });
  it('uses only the typed desktop bridge', async () => {
    const unsubscribe = vi.fn();
    const bridge: QuireBridge = { platform: 'linux', getRecents: vi.fn().mockResolvedValue([recent]), setRecents: vi.fn().mockResolvedValue(undefined), windowControl: vi.fn().mockResolvedValue(undefined), toggleFullscreen: vi.fn().mockResolvedValue(undefined), onMenuAction: vi.fn().mockReturnValue(unsubscribe) };
    const { io } = setup(bridge);
    expect(io.isDesktop).toBe(true); expect(io.platform).toBe('linux');
    await expect(io.loadRecents()).resolves.toEqual([recent]);
    await io.saveRecents([recent]); expect(bridge.setRecents).toHaveBeenCalledWith([recent]);
    await io.windowControl('maximize'); expect(bridge.windowControl).toHaveBeenCalledWith('maximize');
    await io.toggleFullscreen(); expect(bridge.toggleFullscreen).toHaveBeenCalledOnce();
    const listener = vi.fn(); expect(io.onMenuAction(listener)).toBe(unsubscribe);
  });
  it('contains bridge failures and displays a toast', async () => {
    const error = new Error('IPC failure');
    const bridge: QuireBridge = { platform: 'linux', getRecents: vi.fn().mockRejectedValue(error), setRecents: vi.fn().mockRejectedValue(error), windowControl: vi.fn().mockRejectedValue(error), toggleFullscreen: vi.fn().mockRejectedValue(error), onMenuAction: () => { throw error; } };
    const { io, onError } = setup(bridge);
    await expect(io.loadRecents()).resolves.toEqual([]);
    await expect(io.saveRecents([])).resolves.toBe(false);
    await expect(io.windowControl('close')).resolves.toBeUndefined();
    await expect(io.toggleFullscreen()).resolves.toBeUndefined();
    io.onMenuAction(vi.fn())(); expect(onError).toHaveBeenCalledTimes(5);
  });
});
