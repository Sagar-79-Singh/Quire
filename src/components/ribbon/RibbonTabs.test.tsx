import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RibbonTabs } from './RibbonTabs';
const items = [{ id: 'home', label: 'Home' }, { id: 'insert', label: 'Insert', disabled: true }, { id: 'view', label: 'View' }];
describe('RibbonTabs', () => {
  it('supports selection and accessible roving focus', async () => {
    const onChange = vi.fn();
    function Controlled() { const [value, setValue] = useState('home'); return <RibbonTabs label="Ribbon" items={items} value={value} onChange={(id) => { setValue(id); onChange(id); }} />; }
    render(<Controlled />);
    expect(Array.from(screen.getAllByRole('tab')).map((tab) => tab.textContent).join('|')).toMatchInlineSnapshot('"Home|Insert|View"');
    await userEvent.click(screen.getByRole('tab', { name: 'View' })); expect(onChange).toHaveBeenLastCalledWith('view');
    await userEvent.keyboard('{ArrowRight}'); expect(onChange).toHaveBeenLastCalledWith('home');
    await userEvent.keyboard('{ArrowLeft}'); expect(onChange).toHaveBeenLastCalledWith('view');
    await userEvent.keyboard('{End}'); expect(onChange).toHaveBeenLastCalledWith('view');
    await userEvent.keyboard('{Home}'); expect(onChange).toHaveBeenLastCalledWith('home');
    await userEvent.keyboard('{Space}'); expect(onChange).toHaveBeenLastCalledWith('home');
  });
  it('really disables future tabs with a tooltip', async () => {
    const onChange = vi.fn(); render(<RibbonTabs label="Ribbon" items={items} value="home" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Insert' })).toBeDisabled(); expect(screen.getByRole('tab', { name: 'Insert' })).toHaveAttribute('title', 'Coming soon in an update');
    await userEvent.click(screen.getByRole('tab', { name: 'Insert' })); expect(onChange).not.toHaveBeenCalled();
  });
  it('handles an empty keyboard boundary', async () => {
    render(<RibbonTabs label="Empty" items={[]} value="" onChange={vi.fn()} />);
    await userEvent.tab(); await userEvent.keyboard('{ArrowRight}'); expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
