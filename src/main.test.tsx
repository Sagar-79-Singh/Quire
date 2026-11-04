import { beforeEach, describe, expect, it, vi } from 'vitest';
const renderer = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: vi.fn(() => renderer) }));
vi.mock('./shell/App', () => ({ default: () => null }));
beforeEach(() => { vi.resetModules(); renderer.render.mockClear(); document.body.innerHTML = ''; });
describe('renderer entry', () => {
  it('mounts the app when its root exists', async () => { document.body.innerHTML = '<div id="root"></div>'; await import('./main'); expect(renderer.render).toHaveBeenCalledOnce(); });
  it('does nothing when the root is absent', async () => { await import('./main'); expect(renderer.render).not.toHaveBeenCalled(); });
});
