import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { paragraphStyles, StylesGallery } from './StylesGallery';
describe('StylesGallery', () => {
  it('renders every paragraph style in the expanded gallery and applies its semantic block', async () => {
    const onApply = vi.fn(); render(<StylesGallery onApply={onApply} />);
    expect(screen.getAllByRole('button')).toHaveLength(paragraphStyles.length);
    await userEvent.click(screen.getByRole('button', { name: 'Heading 2' })); expect(onApply).toHaveBeenCalledWith('h2', undefined);
    await userEvent.click(screen.getByRole('button', { name: 'Intense Quote' })); expect(onApply).toHaveBeenCalledWith('blockquote', 'intense-quote');
  });
  it('pages compact thumbnails without horizontal scrolling and expands the panel', async () => {
    const onApply = vi.fn(); const onExpand = vi.fn();
    const { container } = render(<StylesGallery onApply={onApply} compact onExpand={onExpand} />);
    expect(container.querySelector('.styles-gallery')?.className).toBe('styles-gallery compact');
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Heading 3' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next styles' }));
    expect(screen.getByRole('button', { name: 'Heading 3' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous styles' }));
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expand styles gallery' }));
    expect(onExpand).toHaveBeenCalled();
  });
});
