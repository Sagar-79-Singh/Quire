import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ruler, rulerTicks } from './Ruler';
import { defaultSettings } from './model';
describe('Ruler', () => {
  it('uses 96-DPI ticks and visualized margins', () => { expect(rulerTicks(816)).toEqual([0, 96, 192, 288, 384, 480, 576, 672, 768]); render(<Ruler settings={defaultSettings} />); expect(screen.getByRole('img', { name: 'Horizontal ruler' }).className).toMatchInlineSnapshot('"ruler ruler-horizontal"'); });
  it('synchronizes vertical offset and zoom', () => { const { container } = render(<Ruler settings={defaultSettings} orientation="vertical" offset={120} zoom={75} />); expect(container.querySelector('.ruler-track')).toHaveStyle({ transform: 'translateY(-120px)' }); expect(screen.getByText('75%')).toBeInTheDocument(); });
});
