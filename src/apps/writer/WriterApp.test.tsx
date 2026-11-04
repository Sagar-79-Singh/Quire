import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import WriterApp from './WriterApp';
import { ToastProvider } from '../../components/ui/Toast';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { resetShellStore, useShellStore } from '../../shell/store';
beforeEach(() => { resetShellStore(); });
const mount = () => render(<ToastProvider><ThemeProvider><WriterApp /></ThemeProvider></ToastProvider>);
describe('Writer shell', () => {
  it('renders the active document page and no stale content', () => {
    const { rerender } = mount(); expect(screen.queryByRole('document')).not.toBeInTheDocument();
    act(() => { useShellStore.getState().openDocument({ title: 'First', content: 'First document\n\nA paragraph' }); }); rerender(<ToastProvider><ThemeProvider><WriterApp /></ThemeProvider></ToastProvider>);
    expect(screen.getByRole('heading', { name: 'First document' })).toBeInTheDocument(); expect(screen.getByText('A paragraph')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Writer' }).className).toMatchInlineSnapshot('"writer-app"');
    act(() => { useShellStore.getState().openDocument({ title: 'Second', content: 'Second document' }); }); rerender(<ToastProvider><ThemeProvider><WriterApp /></ThemeProvider></ToastProvider>);
    expect(screen.getByRole('heading', { name: 'Second document' })).toBeInTheDocument(); expect(screen.queryByText('A paragraph')).not.toBeInTheDocument();
  });
  it('wires working shell commands and disables editor-only commands', async () => {
    useShellStore.getState().openDocument({ title: 'First' }); mount();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled(); expect(screen.getByRole('tab', { name: 'Insert' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Read mode' })); expect(useShellStore.getState().viewMode).toBe('read');
    await userEvent.click(screen.getByRole('button', { name: 'Print layout' })); expect(useShellStore.getState().viewMode).toBe('print');
    await userEvent.click(screen.getByRole('button', { name: 'Side panel', exact: true })); expect(useShellStore.getState().panelOpen).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Dark theme' })); expect(useShellStore.getState().theme).toBe('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Light theme' })); expect(useShellStore.getState().theme).toBe('light');
    await userEvent.click(screen.getByRole('button', { name: 'System theme' })); expect(useShellStore.getState().theme).toBe('system');
    const classic = screen.getAllByRole('button', { name: 'Classic ribbon' })[0]; if (classic) await userEvent.click(classic); expect(useShellStore.getState().ribbonMode).toBe('expanded');
    await userEvent.click(screen.getAllByRole('button', { name: 'Compact ribbon' })[0] ?? screen.getByRole('button')); expect(useShellStore.getState().ribbonMode).toBe('compact');
    await userEvent.click(screen.getByRole('tab', { name: 'View', exact: true })); expect(screen.getByRole('tab', { name: 'View', exact: true })).toHaveAttribute('aria-selected', 'true');
  });
  it('scales the page with shell zoom', () => {
    useShellStore.getState().openDocument({ title: 'First' }); useShellStore.getState().setZoom(75); mount(); expect(screen.getByRole('document').style.transform).toBe('scale(0.75)');
  });
});
