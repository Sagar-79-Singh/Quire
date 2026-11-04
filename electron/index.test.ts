import { describe, expect, it, vi } from 'vitest';
import { app, dialog } from 'electron';
import { bootstrap } from './main';
const start = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('electron', () => ({ app: { quit: vi.fn() }, dialog: { showErrorBox: vi.fn() } }));
vi.mock('./main', () => ({ bootstrap: start }));
describe('desktop entry', () => {
  it('starts the importable bootstrap', async () => {
    await import('./index'); expect(bootstrap).toHaveBeenCalledOnce();
    await Promise.resolve(); expect(dialog.showErrorBox).not.toHaveBeenCalled();
  });
  it('reports startup failure and exits cleanly', async () => {
    vi.resetModules(); start.mockRejectedValueOnce(new Error('Unavailable'));
    await import('./index'); await vi.waitFor(() => { expect(dialog.showErrorBox).toHaveBeenCalledWith('Quire', 'Something went wrong'); });
    expect(app.quit).toHaveBeenCalled();
  });
});
