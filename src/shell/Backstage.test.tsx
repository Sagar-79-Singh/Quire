import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Backstage } from './Backstage';
import { resetShellStore, useShellStore } from './store';
beforeEach(() => { resetShellStore(); });
describe('Backstage', () => {
  it('creates a blank document from New', async () => {
    render(<Backstage />); expect(screen.getByRole('dialog', { name: 'File' }).className).toMatchInlineSnapshot('"dialog backstage"');
    await userEvent.click(screen.getByRole('button', { name: 'Blank document' })); expect(useShellStore.getState().tabs).toHaveLength(1); expect(useShellStore.getState().backstageOpen).toBe(false);
  });
  it('shows real document info and sole authorship', async () => {
    useShellStore.getState().openDocument({ title: 'Report', content: 'Annual report', path: '/documents/report.docx' }); render(<Backstage />);
    await userEvent.click(screen.getByRole('button', { name: 'Info' })); expect(screen.getByText('Report')).toBeInTheDocument(); expect(screen.getByText('/documents/report.docx')).toBeInTheDocument(); expect(screen.getByText('Sagar', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Copyright © 2025 Sagar')).toBeInTheDocument();
  });
  it('disables document operations on home and dispatches real file actions', async () => {
    const onAction = vi.fn(); const { unmount } = render(<Backstage onAction={onAction} />); for (const name of ['Save', 'Save As', 'Export PDF', 'Print', 'Close']) expect(screen.getByRole('button', { name })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Open' })); expect(onAction).toHaveBeenCalledWith('open'); unmount();
    useShellStore.getState().openDocument({ title: 'Report' }); render(<Backstage onAction={onAction} />); await userEvent.click(screen.getByRole('button', { name: 'Save' })); expect(onAction).toHaveBeenCalledWith('save');
  });
  it('closes an open document, goes back, and dismisses on Escape', async () => {
    useShellStore.getState().openDocument({ title: 'Report' }); const { unmount } = render(<Backstage />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' })); expect(useShellStore.getState().tabs).toHaveLength(0); unmount();
    render(<Backstage />); await userEvent.click(screen.getByRole('button', { name: 'Back to document' })); expect(useShellStore.getState().backstageOpen).toBe(false);
    await userEvent.keyboard('{Escape}'); expect(useShellStore.getState().backstageOpen).toBe(false);
  });
});
