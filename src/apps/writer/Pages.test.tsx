import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pages } from './Pages';
import { defaultSettings } from './model';
describe('Pages', () => {
  it('renders real paper dimensions, gaps and page numbers', () => {
    const { container } = render(<Pages settings={{ ...defaultSettings, header: 'Report', footer: 'Private', watermark: 'DRAFT' }} pageCount={3} zoom={75}><p>Content</p></Pages>);
    expect(container.querySelectorAll('.paper-page')).toHaveLength(3); expect(screen.getByText('Content')).toBeInTheDocument(); expect(screen.getAllByText('DRAFT')).toHaveLength(3); expect(screen.getByText('Report')).toBeInTheDocument(); expect(screen.getByText('Private')).toBeInTheDocument(); expect(container.querySelector('.page-stack')).toHaveStyle({ transform: 'scale(0.75)' }); expect(container.querySelector('.paper-page')).toHaveStyle({ width: '816px', height: '1056px' });
  });
  it('supports gridlines and header page-number placement', () => { const { container } = render(<Pages settings={{ ...defaultSettings, pageNumber: { position: 'header', format: 'roman', alignment: 'right' } }} pageCount={1} zoom={100} gridlines><span /></Pages>); expect(container.querySelector('.pages-scroll')).toHaveClass('with-gridlines'); expect(container.querySelector('.page-header')).toHaveTextContent('i'); });
});
