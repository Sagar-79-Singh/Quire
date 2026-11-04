import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Ruler, rulerLabel, rulerTicks } from './Ruler';
import { defaultSettings } from './model';
describe('Ruler', () => {
  it('uses 96-DPI ticks and visualized margins', () => {
    expect(rulerTicks(816)).toEqual([0, 96, 192, 288, 384, 480, 576, 672, 768]);
    render(<Ruler settings={defaultSettings} />);
    expect(screen.getByRole('group', { name: 'Horizontal ruler' }).className).toBe('ruler ruler-horizontal');
  });
  it('scales with zoom and supports centimeter labels', () => {
    const { container } = render(<Ruler settings={defaultSettings} zoom={75} unit="cm" />);
    expect(container.querySelector('.ruler')).toHaveStyle({ width: '612px' });
    expect(rulerLabel(1, 'cm')).toBe('2.54');
    expect(rulerLabel(2, 'in')).toBe('2');
  });
  it('drags indent markers into the store callback', () => {
    const onIndentChange = vi.fn();
    render(<Ruler settings={defaultSettings} onIndentChange={onIndentChange} />);
    const marker = screen.getByRole('slider', { name: 'Left indent' });
    fireEvent.mouseDown(marker, { clientX: 96, clientY: 0 });
    fireEvent.mouseMove(marker, { clientX: 120, clientY: 0 });
    expect(onIndentChange).toHaveBeenCalledWith({ left: 24 });
    fireEvent.mouseUp(marker);
    fireEvent.keyDown(marker, { key: 'ArrowRight' });
    expect(onIndentChange).toHaveBeenCalledWith({ left: 12 });
  });
  it('renders a vertical ruler without indent markers', () => {
    render(<Ruler settings={defaultSettings} orientation="vertical" />);
    expect(screen.getByRole('group', { name: 'Vertical ruler' })).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});
