import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';
describe('Slider', () => {
  it('exposes a labelled range and clamps display values', () => {
    const { rerender } = render(<Slider label="Zoom" min={25} max={400} value={500} onChange={vi.fn()} />);
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveValue('400');
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toMatchInlineSnapshot('"400"');
    rerender(<Slider label="Zoom" min={25} max={400} value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveValue('25');
  });
  it('emits numeric changes and supports disabled state', () => {
    const onChange = vi.fn(); const { rerender } = render(<Slider label="Zoom" min={0} max={100} value={50} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } }); expect(onChange).toHaveBeenCalledWith(75);
    rerender(<Slider label="Zoom" min={0} max={100} value={50} onChange={onChange} disabled disabledReason="Unavailable" />);
    expect(screen.getByRole('slider')).toBeDisabled(); expect(screen.getByRole('slider').parentElement).toHaveAttribute('title', 'Unavailable');
  });
});
