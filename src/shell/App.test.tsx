import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { ShellIO } from './io';
import type { MenuAction } from './shortcuts';
import { resetShellStore, useShellStore } from './store';
function createIO(): ShellIO { return { isDesktop: false, platform: 'browser', loadRecents: vi.fn().mockResolvedValue([]), saveRecents: vi.fn().mockResolvedValue(true), windowControl: vi.fn().mockResolvedValue(undefined), toggleFullscreen: vi.fn().mockResolvedValue(undefined), onMenuAction: vi.fn(() => () => {}), openFile: vi.fn().mockResolvedValue(null), saveFile: vi.fn().mockResolvedValue(null), exportPdf: vi.fn().mockResolvedValue(null), printFile: vi.fn().mockResolvedValue(undefined) }; }
beforeEach(() => { resetShellStore(); });
describe('App shell', () => {
  it('opens Home, creates Writer and returns home without losing tabs', async () => {
    const io = createIO(); render(<App io={io} />); expect(screen.getByRole('heading', { name: 'Make room for a good idea.' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Blank document' })); expect(await screen.findByRole('region', { name: 'Writer' })).toBeInTheDocument();
    const home = screen.getAllByRole('button', { name: 'Home' })[0]; if (home) await userEvent.click(home); expect(screen.getByRole('heading', { name: 'Make room for a good idea.' })).toBeInTheDocument(); expect(useShellStore.getState().tabs).toHaveLength(1);
    await waitFor(() => { expect(io.loadRecents).toHaveBeenCalled(); });
  });
  it('routes native menu commands and shell shortcuts', async () => {
    const io = createIO(); render(<App io={io} />);
    const calls = vi.mocked(io.onMenuAction).mock.calls; const dispatch = calls[0]?.[0]; expect(dispatch).toBeDefined();
    const send = (action: MenuAction): void => { act(() => { dispatch?.(action); }); };
    send('new'); send('new'); send('next-tab'); send('previous-tab'); send('zoom-in'); send('zoom-out'); send('zoom-reset'); send('theme-dark'); send('theme-light'); send('theme-system'); send('toggle-panel'); send('toggle-ribbon'); send('fullscreen'); send('open'); send('undo');
    expect(useShellStore.getState().tabs).toHaveLength(2); expect(io.toggleFullscreen).toHaveBeenCalled();
    await userEvent.keyboard('{Control>}n{/Control}'); expect(useShellStore.getState().tabs).toHaveLength(3);
    await userEvent.keyboard('{Control>}w{/Control}'); expect(useShellStore.getState().tabs).toHaveLength(2);
    send('close-document'); send('close-document'); send('home'); send('save'); send('save-as'); send('export-pdf'); send('print'); send('redo'); send('find');
  });
  it('opens backstage and hydrates recents before persisting', async () => {
    const io = createIO(); render(<App io={io} />); await userEvent.click(screen.getByRole('button', { name: 'Blank document' }));
    await screen.findByRole('region', { name: 'Writer' }); await userEvent.click(screen.getByRole('button', { name: 'File' })); expect(screen.getByRole('dialog', { name: 'File' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => { useShellStore.getState().addRecent({ id: 'r', title: 'Test', path: '/test.docx', appType: 'writer', templateId: 'blank', modifiedAt: 100 }); });
    await waitFor(() => { expect(io.saveRecents).toHaveBeenCalledWith([expect.objectContaining({ id: 'r' })]); });
  });
  it('contains rejected injected IO and uses the browser adapter by default', async () => {
    const io = { ...createIO(), loadRecents: vi.fn().mockRejectedValue(new Error('Unavailable')) }; const { unmount } = render(<App io={io} />); expect(await screen.findByRole('alert')).toHaveTextContent('Recent documents could not be loaded'); unmount();
    render(<App />); expect(screen.getByRole('heading', { name: 'Make room for a good idea.' })).toBeInTheDocument();
  });
});
