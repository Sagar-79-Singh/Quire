import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WriterRibbon, ribbonTabs } from './Ribbon';
import type { RibbonProps } from './Ribbon';
import { newWriterDocument } from './store';
import { resetShellStore, useShellStore } from '../../shell/store';
beforeEach(() => { resetShellStore(); });
function mount(overrides: Partial<RibbonProps> = {}) {
  const props: RibbonProps = { doc: newWriterDocument('Test'), onCommand: vi.fn(), onDialog: vi.fn(), onSettings: vi.fn(), onStyle: vi.fn(), onFile: vi.fn(), ruler: true, gridlines: false, onRuler: vi.fn(), onGridlines: vi.fn(), onInsert: vi.fn(), recipients: [], onRecipients: vi.fn(), onMerge: vi.fn(), isDesktop: false, ...overrides };
  render(<WriterRibbon {...props} />); return props;
}
describe('Writer ribbon', () => {
  it('exposes all ten tabs and keeps every group reachable', async () => {
    mount(); expect(screen.getAllByRole('tab')).toHaveLength(10);
    for (const tab of ribbonTabs) { await userEvent.click(screen.getByRole('tab', { name: tab.label })); expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-label', tab.id); const panel = screen.getByRole('tabpanel'); expect(within(panel).getAllByRole('button').length).toBeGreaterThan(0); }
  });
  it('dispatches formatting, styles and dialogs', async () => {
    const props = mount(); await userEvent.click(screen.getAllByRole('button', { name: 'Bold', exact: true })[0]!); expect(props.onCommand).toHaveBeenCalledWith('bold');
    await userEvent.click(screen.getAllByRole('button', { name: 'Heading 1', exact: true })[0]!); expect(props.onStyle).toHaveBeenCalledWith('h1', undefined);
    await userEvent.click(screen.getByRole('tab', { name: 'Insert' })); await userEvent.click(screen.getByRole('button', { name: 'Insert table' })); expect(props.onDialog).toHaveBeenCalledWith('table');
  });
  it('changes page settings and view modes', async () => {
    const props = mount(); await userEvent.click(screen.getByRole('tab', { name: 'Layout' })); await userEvent.click(screen.getByRole('button', { name: 'Paper size' })); await userEvent.click(screen.getByRole('menuitem', { name: 'A4 · 210 × 297 mm' })); expect(props.onSettings).toHaveBeenCalledWith({ paper: 'a4' });
    await userEvent.click(screen.getByRole('tab', { name: 'View' })); await userEvent.click(screen.getByRole('button', { name: 'Read mode' })); expect(useShellStore.getState().viewMode).toBe('read');
    expect(screen.getByRole('button', { name: 'New window' })).toBeDisabled();
  });
  it('keeps merge and shape actions honestly disabled until usable', async () => {
    const props = mount({ recipients: [{ Name: 'Sagar' }] }); await userEvent.click(screen.getByRole('tab', { name: 'Mailings' })); await userEvent.click(screen.getByRole('button', { name: 'Finish & merge' })); expect(props.onMerge).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('tab', { name: 'Draw' })); expect(screen.getByRole('button', { name: 'Shape fill' })).toBeDisabled();
  });
});
