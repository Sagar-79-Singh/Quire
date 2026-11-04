import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pages } from './Pages';
import { defaultSettings } from './model';
describe('Pages', () => {
  it('renders real paper dimensions, gaps and page numbers', () => {
    const { container } = render(<Pages settings={{ ...defaultSettings, header: 'Report', footer: 'Private', watermark: 'DRAFT' }} pageCount={3} zoom={75}><p>Content</p></Pages>);
    expect(container.querySelectorAll('.paper-page')).toHaveLength(3); expect(screen.getByText('Content')).toBeInTheDocument(); expect(screen.getAllByText('DRAFT')).toHaveLength(3); expect(screen.getAllByText('Report')).toHaveLength(3); expect(screen.getAllByText('Private')).toHaveLength(3); expect(container.querySelector('.page-stack')).toHaveStyle({ transform: 'scale(0.75)' }); expect(container.querySelector('.paper-page')).toHaveStyle({ width: '816px', height: '1056px' });
  });
  it('supports gridlines and header page-number placement', () => { const { container } = render(<Pages settings={{ ...defaultSettings, pageNumber: { position: 'header', format: 'roman', alignment: 'right' } }} pageCount={1} zoom={100} gridlines><span /></Pages>); expect(container.querySelector('.pages-scroll')).toHaveClass('with-gridlines'); expect(container.querySelector('.page-header')).toHaveTextContent('i'); });
  it('renders aligned rulers and crop marks, and forwards ctrl+wheel zoom', () => {
    const onZoom = vi.fn(); const onIndentChange = vi.fn();
    const { container } = render(<Pages settings={defaultSettings} pageCount={2} zoom={100} ruler marginGuides onZoom={onZoom} onIndentChange={onIndentChange}><p>Content</p></Pages>);
    expect(screen.getByRole('group', { name: 'Horizontal ruler' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Vertical ruler' })).toBeInTheDocument();
    expect(container.querySelectorAll('.crop-marks')).toHaveLength(2);
    fireEvent.wheel(screen.getByTestId('writer-canvas'), { ctrlKey: true, deltaY: -100 });
    expect(onZoom).toHaveBeenCalledWith(110);
    fireEvent.wheel(screen.getByTestId('writer-canvas'), { ctrlKey: true, deltaY: 100 });
    expect(onZoom).toHaveBeenCalledWith(90);
  });
  it('can hide margin guides', () => {
    const { container } = render(<Pages settings={defaultSettings} pageCount={1} zoom={100} marginGuides={false}><p>Content</p></Pages>);
    expect(container.querySelector('.crop-marks')).not.toBeInTheDocument();
  });
});
