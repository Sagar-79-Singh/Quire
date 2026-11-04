import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RibbonButton } from './RibbonButton';
describe('RibbonButton', () => {
  it('renders an original icon, label and pressed state', async () => {
    const onClick = vi.fn(); render(<RibbonButton icon="bold" label="Bold" active onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Bold' }); expect(button).toHaveAttribute('aria-pressed', 'true'); expect(button.getAttribute('aria-pressed')).toMatchInlineSnapshot('"true"');
    await userEvent.click(button); expect(onClick).toHaveBeenCalledOnce();
  });
  it('supports all sizes and icon-only labels', () => {
    const { rerender } = render(<RibbonButton icon="save" label="Save" size="lg" hideLabel />);
    expect(screen.getByRole('button')).toHaveClass('ribbon-button-lg'); expect(screen.getByRole('button').querySelector('svg')).toHaveAttribute('width', '32');
    rerender(<RibbonButton icon="save" label="Save" size="md" />); expect(screen.getByRole('button')).toHaveClass('ribbon-button-md');
  });
  it('is truly disabled with an explanatory tooltip', async () => {
    const onClick = vi.fn(); render(<RibbonButton icon="italic" label="Italic" disabled disabledReason="Editor unavailable" onClick={onClick} />);
    expect(screen.getByRole('button')).toBeDisabled(); expect(screen.getByRole('button')).toHaveAttribute('title', 'Editor unavailable');
    await userEvent.click(screen.getByRole('button')); expect(onClick).not.toHaveBeenCalled();
  });
});
