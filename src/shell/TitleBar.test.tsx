import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TitleBar } from './TitleBar';
import type { ShellIO } from './io';
import { resetShellStore, useShellStore } from './store';
const io: ShellIO = { isDesktop: false, platform: 'browser', loadRecents: vi.fn(), saveRecents: vi.fn(), windowControl: vi.fn(), toggleFullscreen: vi.fn(), onMenuAction: vi.fn(() => () => {}), openFile: vi.fn().mockResolvedValue(null), saveFile: vi.fn().mockResolvedValue(null), exportPdf: vi.fn().mockResolvedValue(null), printFile: vi.fn().mockResolvedValue(undefined) };
beforeEach(() => { resetShellStore(); });
describe('TitleBar', () => {
  it('renders one centered, click-to-rename document title in the title bar', async () => {
    useShellStore.getState().openDocument({ title: 'Document 1' }); render(<TitleBar io={io} onAction={vi.fn()} />);
    const titleBar = screen.getByRole('banner');
    expect(within(titleBar).getAllByText('Document 1', { exact: true })).toHaveLength(1);
    await userEvent.click(within(titleBar).getByRole('button', { name: 'Rename document' }));
    expect(within(titleBar).getByRole('textbox', { name: 'Document name' })).toHaveValue('Document 1');
  });
  it('renames inline and commits with Enter', async () => {
    useShellStore.getState().openDocument({ title: 'Original' }); render(<TitleBar io={io} onAction={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename document' })); const input = screen.getByRole('textbox', { name: 'Document name' }); await userEvent.clear(input); await userEvent.type(input, 'Renamed{Enter}');
    expect(useShellStore.getState().tabs[0]?.title).toBe('Renamed');
  });
  it('commits on blur and cancels with Escape', async () => {
    useShellStore.getState().openDocument({ title: 'Original' }); render(<TitleBar io={io} onAction={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename document' })); await userEvent.clear(screen.getByRole('textbox')); await userEvent.type(screen.getByRole('textbox'), 'Blur name'); await userEvent.tab(); expect(useShellStore.getState().tabs[0]?.title).toBe('Blur name');
    await userEvent.click(screen.getByRole('button', { name: 'Rename document' })); await userEvent.clear(screen.getByRole('textbox')); await userEvent.type(screen.getByRole('textbox'), 'Cancelled{Escape}'); expect(useShellStore.getState().tabs[0]?.title).toBe('Blur name');
  });
  it('searches tools, executes a result and handles no matches', async () => {
    const onAction = vi.fn(); render(<TitleBar io={io} onAction={onAction} />); const search = screen.getByRole('combobox');
    await userEvent.type(search, 'dark'); expect(screen.getByRole('listbox').textContent).toMatchInlineSnapshot('"Dark theme"'); await userEvent.keyboard('{ArrowDown}{Enter}'); expect(onAction).toHaveBeenCalledWith('theme-dark');
    await userEvent.clear(search); await userEvent.type(search, 'not-a-tool'); expect(screen.getByText('No matching tools')).toBeInTheDocument(); await userEvent.keyboard('{Escape}'); expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.clear(search); await userEvent.click(search); await userEvent.keyboard('{Enter}'); expect(onAction).toHaveBeenCalledWith('new'); const homeButton = screen.getAllByRole('button', { name: 'Home' })[0]; if (homeButton) await userEvent.click(homeButton); expect(onAction).toHaveBeenCalledWith('home');
  });
  it('has real disabled pending controls and browser window controls', () => {
    render(<TitleBar io={io} onAction={vi.fn()} />); expect(screen.getByRole('switch', { name: 'AutoSave' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });
  it('delegates native window controls through the typed API', async () => {
    render(<TitleBar io={{ ...io, isDesktop: true }} onAction={vi.fn()} />); await userEvent.click(screen.getByRole('button', { name: 'Minimize' })); expect(io.windowControl).toHaveBeenCalledWith('minimize');
    await userEvent.click(screen.getByRole('button', { name: 'Maximize' })); expect(io.windowControl).toHaveBeenCalledWith('maximize'); await userEvent.click(screen.getByRole('button', { name: 'Close' })); expect(io.windowControl).toHaveBeenCalledWith('close');
  });
});
