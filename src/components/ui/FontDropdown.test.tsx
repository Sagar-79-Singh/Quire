import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FontDropdown } from './FontDropdown';
import type { FontDropdownGroup } from './FontDropdown';

const groups: FontDropdownGroup[] = [
  { label: 'Theme Fonts', options: [{ value: 'Arial', label: 'Arial', fontFamily: 'Arial' }, { value: 'Calibri', label: 'Calibri', fontFamily: 'Calibri' }] },
  { label: 'All Fonts', options: [{ value: 'DejaVu Sans', label: 'DejaVu Sans', fontFamily: 'DejaVu Sans' }] },
];

describe('FontDropdown', () => {
  it('renders a custom trigger and grouped font listbox with actual font families', async () => {
    const onChange = vi.fn();
    render(<FontDropdown label="Font family" value="Arial" groups={groups} width={130} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Font family' });
    expect(trigger).toHaveTextContent('Arial');
    expect(trigger.querySelector('svg.font-dropdown-chevron')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    const listbox = screen.getByRole('listbox', { name: 'Font family options' });
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getByRole('group', { name: 'Theme Fonts' })).toBeInTheDocument();
    expect(within(listbox).getByRole('group', { name: 'All Fonts' })).toBeInTheDocument();
    expect(within(listbox).getAllByRole('option')).toHaveLength(3);
    expect(within(listbox).getByRole('option', { name: 'DejaVu Sans' })).toHaveStyle({ fontFamily: 'DejaVu Sans' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('navigates options by arrow keys and selects with Enter', async () => {
    const onChange = vi.fn();
    render(<FontDropdown label="Font family" value="Arial" groups={groups} width={130} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Font family' });
    await userEvent.click(trigger);
    const listbox = screen.getByRole('listbox', { name: 'Font family options' });
    expect(listbox).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('Calibri');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens from the keyboard and navigates to the first and last options', async () => {
    const onChange = vi.fn();
    render(<FontDropdown label="Font family" value="Arial" groups={groups} width={130} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Font family' });
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox', { name: 'Font family options' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('DejaVu Sans');
    await userEvent.click(trigger);
    await userEvent.keyboard('{Home}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('Arial');
    await userEvent.click(trigger);
    await userEvent.keyboard('{End}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('DejaVu Sans');
  });

  it('closes on Escape, Tab, outside click, and selection', async () => {
    const onChange = vi.fn();
    render(<><FontDropdown label="Font family" value="Arial" groups={groups} width={130} onChange={onChange} /><button type="button" aria-label="Outside target">Outside</button></>);
    const trigger = screen.getByRole('button', { name: 'Font family' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.keyboard('{Tab}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outside target' })).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Outside target' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'DejaVu Sans' }));
    expect(onChange).toHaveBeenCalledWith('DejaVu Sans');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
