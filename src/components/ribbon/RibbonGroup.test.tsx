import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RibbonGroup } from './RibbonGroup';
describe('RibbonGroup', () => {
  it('labels a semantic group without hiding its controls', () => {
    render(<RibbonGroup title="Font" className="custom"><button>Bold</button></RibbonGroup>);
    const group = screen.getByRole('region', { name: 'Font' }); expect(group).toContainElement(screen.getByRole('button', { name: 'Bold' }));
    expect(group).toHaveClass('custom'); expect(group).toHaveAttribute('data-ribbon-group', 'Font'); expect(group.getAttribute('data-ribbon-group')).toMatchInlineSnapshot('"Font"');
  });
});
