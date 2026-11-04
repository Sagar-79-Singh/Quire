import { describe, expect, it, vi } from 'vitest';
import { installPreload } from './preload';
vi.mock('./preload', () => ({ installPreload: vi.fn() }));
describe('preload entry', () => {
  it('installs the bridge exactly once', async () => { await import('./preload-entry'); expect(installPreload).toHaveBeenCalledOnce(); });
});
