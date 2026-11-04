import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RibbonDropdown } from './RibbonDropdown';
describe('RibbonDropdown', () => {
  it('opens a keyboard-navigable menu and selects an action', async () => {
    const onSelect = vi.fn(); render(<RibbonDropdown label="More" items={[{ id: 'one', label: 'One', icon: 'save', onSelect }, { id: 'two', label: 'Two', onSelect }]} />);
    const trigger = screen.getByRole('button', { name: 'More' }); expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger); expect(screen.getByRole('menu').getAttribute('aria-label')).toMatchInlineSnapshot('"More"');
    await userEvent.keyboard('{ArrowDown}'); expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}'); expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus();
    await userEvent.click(screen.getByRole('menuitem', { name: 'One' })); expect(onSelect).toHaveBeenCalledOnce(); expect(trigger).toHaveFocus(); expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  it('closes on Escape and outside clicks', async () => {
    render(<><RibbonDropdown label="More"><button>Extra command</button></RibbonDropdown><button>Outside</button></>);
    await userEvent.click(screen.getByRole('button', { name: 'More' })); expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More' })); await userEvent.click(screen.getByRole('button', { name: 'Outside' })); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('can reopen after closing from its trigger', async () => {
    render(<RibbonDropdown label="More"><span>Commands</span></RibbonDropdown>);
    const trigger = screen.getByRole('button', { name: 'More' }); await userEvent.click(trigger); await userEvent.click(trigger); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
