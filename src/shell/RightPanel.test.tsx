import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { RightPanel } from './RightPanel';
import { resetShellStore, useShellStore } from './store';
beforeEach(() => { resetShellStore(); useShellStore.getState().setPanelOpen(true); });
describe('RightPanel', () => {
  it('switches among the three panel tabs and closes accessibly', async () => {
    render(<RightPanel />); expect(screen.getByRole('complementary', { name: 'Document side panel' })).toHaveClass('is-open');
    expect(screen.getByRole('tabpanel').className).toMatchInlineSnapshot('"panel-content"');
    await userEvent.click(screen.getByRole('tab', { name: 'Format Shape' })); expect(useShellStore.getState().panelTab).toBe('shape'); expect(screen.getByText('Select a shape to format it.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Comments' })); expect(screen.getByText('A conversation starts here.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close side panel' })); expect(useShellStore.getState().panelOpen).toBe(false); expect(screen.getByRole('complementary', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });
  it('really disables pending styles with tooltips', async () => {
    render(<RightPanel />); const style = screen.getByRole('button', { name: 'Heading 1' }); expect(style).toBeDisabled(); expect(style).toHaveAttribute('title', 'Paragraph styles become available with the editor.');
    await userEvent.click(style); expect(useShellStore.getState().panelTab).toBe('styles');
  });
});
