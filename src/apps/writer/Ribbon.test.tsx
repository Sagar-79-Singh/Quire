import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WriterRibbon, ribbonTabs } from './Ribbon';
import type { RibbonProps } from './Ribbon';
import { newWriterDocument } from './store';
import { resetShellStore, useShellStore } from '../../shell/store';
beforeEach(() => { resetShellStore(); localStorage.clear(); });
function mount(overrides: Partial<RibbonProps> = {}) {
  const props: RibbonProps = { doc: newWriterDocument('Test'), onCommand: vi.fn(), onDialog: vi.fn(), onSettings: vi.fn(), onStyle: vi.fn(), onFile: vi.fn(), ruler: true, gridlines: false, onRuler: vi.fn(), onGridlines: vi.fn(), onInsert: vi.fn(), recipients: [], onRecipients: vi.fn(), onMerge: vi.fn(), isDesktop: false, marginGuides: true, onMarginGuides: vi.fn(), rulerUnit: 'in', onRulerUnit: vi.fn(), ...overrides };
  render(<WriterRibbon {...props} />); return props;
}
describe('Writer ribbon', () => {
  it('exposes File plus ten tabs and keeps every group reachable', async () => {
    mount(); expect(screen.getAllByRole('tab')).toHaveLength(11);
    await userEvent.click(screen.getByRole('tab', { name: 'File' })); expect(useShellStore.getState().backstageOpen).toBe(true);
    for (const tab of ribbonTabs.filter((item) => item.id !== 'file')) { await userEvent.click(screen.getByRole('tab', { name: tab.label })); expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-label', tab.id); const panel = screen.getByRole('tabpanel'); expect(within(panel).getAllByRole('button').length).toBeGreaterThan(0); }
  });
  it('dispatches formatting, styles and dialogs', async () => {
    const props = mount(); await userEvent.click(screen.getAllByRole('button', { name: 'Bold' })[0] as HTMLElement); expect(props.onCommand).toHaveBeenCalledWith('bold');
    await userEvent.click(screen.getAllByRole('button', { name: 'Heading 1' })[0] as HTMLElement); expect(props.onStyle).toHaveBeenCalledWith('h1', undefined);
    await userEvent.click(screen.getByRole('tab', { name: 'Insert' })); await userEvent.click(screen.getByRole('button', { name: 'Insert table' })); expect(props.onDialog).toHaveBeenCalledWith('table');
  });
  it('renders two deliberate command rows for font and paragraph controls', () => {
    mount();
    const font = screen.getByRole('region', { name: 'Font' });
    const paragraph = screen.getByRole('region', { name: 'Paragraph' });
    expect(font.querySelectorAll('[data-ribbon-row^="font-"]')).toHaveLength(2);
    expect(paragraph.querySelectorAll('[data-ribbon-row^="paragraph-"]')).toHaveLength(2);
    expect(within(font).getByRole('button', { name: 'Font family' })).toBeInTheDocument();
    expect(within(font).getByRole('button', { name: 'Font size' })).toBeInTheDocument();
    expect(within(font).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(font).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(within(paragraph).getByRole('button', { name: 'Bullets' })).toBeInTheDocument();
    expect(within(paragraph).getByRole('button', { name: 'Align left' })).toBeInTheDocument();
  });
  it('loads filtered, prioritized system fonts from IPC and falls back only when the call fails', async () => {
    const getSystemFonts = vi.fn().mockResolvedValue(['Zulu Sans', 'Arial', 'DejaVu Sans', 'Symbola', 'Segoe UI', 'Calibri', 'Cambria', 'Times New Roman', 'Aptos', 'Georgia', 'Verdana', 'Glyph Icons', 'C059']);
    Object.defineProperty(window, 'quire', { configurable: true, value: { getSystemFonts } });
    const props = mount();
    const fontTrigger = screen.getByRole('button', { name: 'Font family' });
    await waitFor(() => expect(getSystemFonts).toHaveBeenCalledOnce());
    await userEvent.click(fontTrigger);
    const fontListbox = screen.getByRole('listbox', { name: 'Font family options' });
    await waitFor(() => expect(within(fontListbox).getAllByRole('option')).toHaveLength(10));
    const fontNames = within(fontListbox).getAllByRole('option').map((option) => option.textContent);
    expect(fontNames).toEqual(['Arial', 'Calibri', 'Cambria', 'Times New Roman', 'Segoe UI', 'Aptos', 'Georgia', 'Verdana', 'DejaVu Sans', 'Zulu Sans']);
    expect(fontNames.some((font) => /glyph|icon|symbol/i.test(font ?? ''))).toBe(false);
    await userEvent.click(within(fontListbox).getByRole('option', { name: 'DejaVu Sans' }));
    expect(props.onCommand).toHaveBeenCalledWith('fontName', 'DejaVu Sans');
    expect(fontTrigger).toHaveTextContent('DejaVu Sans');

    cleanup(); resetShellStore();
    const failedGetSystemFonts = vi.fn().mockRejectedValue(new Error('Font service unavailable'));
    Object.defineProperty(window, 'quire', { configurable: true, value: { getSystemFonts: failedGetSystemFonts } });
    mount();
    const fallbackTrigger = screen.getByRole('button', { name: 'Font family' });
    await waitFor(() => expect(failedGetSystemFonts).toHaveBeenCalledOnce());
    await userEvent.click(fallbackTrigger);
    expect(screen.getByRole('listbox', { name: 'Font family options' }).querySelectorAll('[role="option"]')).toHaveLength(9);
    expect(screen.getByRole('option', { name: 'Courier New' })).toBeInTheDocument();
  });
  it('uses the custom font-size menu with the fixed size choices', async () => {
    const props = mount();
    const trigger = screen.getByRole('button', { name: 'Font size' });
    await userEvent.click(trigger);
    const listbox = screen.getByRole('listbox', { name: 'Font size options' });
    expect(within(listbox).getAllByRole('option').map((option) => option.textContent)).toEqual(['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72']);
    await userEvent.click(within(listbox).getByRole('option', { name: '22' }));
    expect(props.onCommand).toHaveBeenCalledWith('fontSize', '22');
    expect(trigger).toHaveTextContent('22');
  });
  it('keeps clipboard commands icon-only in a vertical stack', () => {
    mount();
    const clipboard = screen.getByRole('region', { name: 'Clipboard' });
    const cut = within(clipboard).getByRole('button', { name: 'Cut' });
    const copy = within(clipboard).getByRole('button', { name: 'Copy' });
    const painter = within(clipboard).getByRole('button', { name: 'Format painter' });
    expect(cut.closest('.ribbon-stack')?.classList.contains('ribbon-clipboard-stack')).toBe(true);
    expect(cut.querySelector('span')).not.toBeInTheDocument();
    expect(copy.querySelector('span')).not.toBeInTheDocument();
    expect(painter.querySelector('span')).not.toBeInTheDocument();
  });
  it('changes page settings and view modes', async () => {
    const props = mount(); await userEvent.click(screen.getByRole('tab', { name: 'Layout' })); await userEvent.click(screen.getByRole('button', { name: 'Paper size' })); await userEvent.click(screen.getByRole('menuitem', { name: 'A4 · 210 × 297 mm' })); expect(props.onSettings).toHaveBeenCalledWith({ paper: 'a4' });
    await userEvent.click(screen.getByRole('tab', { name: 'View' })); await userEvent.click(screen.getByRole('button', { name: 'Read mode' })); expect(useShellStore.getState().viewMode).toBe('read');
    expect(screen.getByRole('button', { name: 'New window' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Margin guides' })); expect(props.onMarginGuides).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Ruler units' })); await userEvent.click(screen.getByRole('menuitem', { name: 'Centimeters' })); expect(props.onRulerUnit).toHaveBeenCalledWith('cm');
  });
  it('keeps merge and shape actions honestly disabled until usable', async () => {
    const props = mount({ recipients: [{ Name: 'Sagar' }] }); await userEvent.click(screen.getByRole('tab', { name: 'Mailings' })); await userEvent.click(screen.getByRole('button', { name: 'Finish & merge' })); expect(props.onMerge).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('tab', { name: 'Draw' })); expect(screen.getByRole('button', { name: 'Shape fill' })).toBeDisabled();
  });
  it('pins the compact ribbon and persists the preference', async () => {
    mount(); const pin = screen.getByRole('button', { name: 'Compact ribbon (Ctrl+F1)' });
    await userEvent.click(pin); expect(useShellStore.getState().ribbonMode).toBe('expanded'); expect(localStorage.getItem('quire.ribbonMode')).toBe('expanded');
    await userEvent.click(pin); expect(useShellStore.getState().ribbonMode).toBe('compact');
  });
});
