import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { paragraphStyles, StylesGallery } from './StylesGallery';
describe('StylesGallery', () => {
  it('renders every paragraph style and applies its semantic block', async () => { const onApply = vi.fn(); render(<StylesGallery onApply={onApply} compact />); expect(screen.getAllByRole('button')).toHaveLength(paragraphStyles.length); await userEvent.click(screen.getByRole('button', { name: 'Heading 2' })); expect(onApply).toHaveBeenCalledWith('h2', undefined); await userEvent.click(screen.getByRole('button', { name: 'Intense Quote' })); expect(onApply).toHaveBeenCalledWith('blockquote', 'intense-quote'); expect(screen.getByRole('group').className).toMatchInlineSnapshot('"styles-gallery compact"'); });
});
