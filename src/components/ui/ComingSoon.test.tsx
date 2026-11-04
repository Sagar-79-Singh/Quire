import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ComingSoon from './ComingSoon';
describe('ComingSoon', () => {
  it('is explanatory and genuinely unavailable', () => {
    render(<ComingSoon name="Sheets" />);
    expect(screen.getByRole('heading').textContent).toMatchInlineSnapshot('"Good things take a little time."');
    expect(screen.getByRole('button', { name: 'Coming soon in an update' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Not available yet');
  });
  it('has a neutral default label', () => { render(<ComingSoon />); expect(screen.getByRole('region', { name: 'Quire' })).toBeInTheDocument(); });
});
