import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RightPanel } from './RightPanel';
import { resetShellStore, useShellStore } from './store';
beforeEach(() => { resetShellStore(); useShellStore.getState().setPanelOpen(true); });
describe('RightPanel', () => {
  it('switches among the three panel tabs and closes accessibly', async () => {
    render(<RightPanel />); expect(screen.getByRole('complementary', { name: 'Document side panel' })).toHaveClass('is-open');
    expect(screen.getByRole('tabpanel').className).toMatchInlineSnapshot('"panel-content"');
    await userEvent.click(screen.getByRole('tab', { name: 'Format Shape' })); expect(useShellStore.getState().panelTab).toBe('shape'); expect(screen.getAllByText('Select a shape to format it.').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('tab', { name: 'Comments' })); expect(screen.getAllByText('A conversation starts here.').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Close side panel' })); expect(useShellStore.getState().panelOpen).toBe(false); expect(screen.getByRole('complementary', { hidden: true })).toHaveAttribute('aria-hidden', 'true'); expect(screen.getByRole('complementary', { hidden: true })).not.toHaveClass('is-open');
  });
  it('applies real paragraph styles when an editor is connected', async () => {
    const onStyle = vi.fn(); render(<RightPanel onStyle={onStyle} />); await userEvent.click(screen.getByRole('button', { name: 'Heading 1' })); expect(onStyle).toHaveBeenCalledWith('h1', undefined);
  });
  it('explains why styles are unavailable without an editor', () => {
    render(<RightPanel />); expect(screen.getByText('Paragraph styles become available with the editor.')).toBeInTheDocument();
  });
});
