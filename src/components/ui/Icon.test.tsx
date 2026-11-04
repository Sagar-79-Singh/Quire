import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon, iconMap } from './Icon';
import type { IconName } from './Icon';
describe('Icon', () => {
  it('renders original decorative SVG geometry at both ribbon sizes', () => {
    const { container, rerender } = render(<Icon name="writer" size={32} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.5');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Icon name="home" />); expect(container.querySelector('svg')).toHaveAttribute('width', '16');
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toMatchInlineSnapshot('"0 0 24 24"');
  });
  it.each(Object.keys(iconMap) as IconName[])('provides paths for %s', (name) => {
    const { container } = render(<Icon name={name} />); expect(container.querySelector('svg')?.childElementCount).toBeGreaterThan(0);
  });
  it('is hidden from the accessibility tree', () => { render(<Icon name="save" />); expect(screen.queryByRole('img')).not.toBeInTheDocument(); });
});
