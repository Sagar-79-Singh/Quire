import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
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
    await userEvent.click(screen.getByRole('button', { name: 'Info', exact: true })); expect(screen.getByText('Report')).toBeInTheDocument(); expect(screen.getByText('/documents/report.docx')).toBeInTheDocument(); expect(screen.getByText('Sagar', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Copyright © 2025 Sagar')).toBeInTheDocument();
  });
  it('disables unavailable file operations and close on home', () => {
    render(<Backstage />); for (const name of ['Open', 'Save', 'Save As', 'Export PDF', 'Print', 'Close']) expect(screen.getByRole('button', { name, exact: true })).toBeDisabled();
    expect(screen.getByText('Not saved yet')).not.toBeInTheDocument();
  });
  it('closes an open document, goes back, and dismisses on Escape', async () => {
    useShellStore.getState().openDocument({ title: 'Report' }); const { unmount } = render(<Backstage />);
    await userEvent.click(screen.getByRole('button', { name: 'Close', exact: true })); expect(useShellStore.getState().tabs).toHaveLength(0); unmount();
    render(<Backstage />); await userEvent.click(screen.getByRole('button', { name: 'Back to document' })); expect(useShellStore.getState().backstageOpen).toBe(false);
    await userEvent.keyboard('{Escape}'); expect(useShellStore.getState().backstageOpen).toBe(false);
  });
});
