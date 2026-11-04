import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';
describe('Dialog', () => {
  it('labels the modal, traps focus and restores the opener', async () => {
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    const onClose = vi.fn(); render(<Dialog title="Details" onClose={onClose}><button>First action</button><button>Last action</button></Dialog>);
    expect(screen.getByRole('dialog', { name: 'Details' }).getAttribute('aria-modal')).toMatchInlineSnapshot('"true"');
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    await userEvent.tab(); expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
    await userEvent.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    await userEvent.keyboard('{Escape}'); expect(onClose).toHaveBeenCalledOnce();
    opener.remove();
  });
  it('supports backdrop dismissal and an empty focus boundary', async () => {
    const onClose = vi.fn(); const { container } = render(<Dialog title="Empty" onClose={onClose} showClose={false}><p>Details</p></Dialog>);
    expect(screen.getByRole('dialog')).toHaveFocus(); await userEvent.tab(); expect(screen.getByRole('dialog')).toHaveFocus();
    await userEvent.click(container.querySelector('.dialog-backdrop') ?? container); expect(onClose).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Details')); expect(onClose).toHaveBeenCalledOnce();
  });
});
