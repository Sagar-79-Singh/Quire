import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle';
describe('Toggle', () => {
  it('announces and changes its checked state', async () => {
    const onChange = vi.fn(); render(<Toggle label="AutoSave" checked={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'AutoSave' });
    expect(toggle).toHaveAttribute('aria-checked', 'false'); expect(toggle.getAttribute('role')).toMatchInlineSnapshot('"switch"');
    await userEvent.click(toggle); expect(onChange).toHaveBeenCalledWith(true);
  });
  it('really disables the switch and explains why', async () => {
    const onChange = vi.fn(); render(<Toggle compact label="AutoSave" checked onChange={onChange} disabled disabledReason="Open a document" />);
    const toggle = screen.getByRole('switch'); expect(toggle).toBeDisabled(); expect(toggle).toHaveAttribute('title', 'Open a document');
    await userEvent.click(toggle); expect(onChange).not.toHaveBeenCalled();
  });
});
