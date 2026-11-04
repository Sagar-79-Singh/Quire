import { useState } from 'react';
import { en } from '../../i18n/en';
import { Icon } from '../../components/ui/Icon';
export const paragraphStyles = [
  { id: 'p', label: 'Normal' }, { id: 'h1', label: 'Heading 1' }, { id: 'h2', label: 'Heading 2' }, { id: 'h3', label: 'Heading 3' },
  { id: 'h1', label: 'Title', className: 'document-title' }, { id: 'h2', label: 'Subtitle', className: 'document-subtitle' },
  { id: 'blockquote', label: 'Quote' }, { id: 'blockquote', label: 'Intense Quote', className: 'intense-quote' }, { id: 'p', label: 'List Paragraph', className: 'list-paragraph' },
] as const;
export function StylesGallery({ onApply, compact = false, onExpand }: { onApply: (tag: string, className?: string) => void; compact?: boolean; onExpand?: () => void }) {
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const pages = Math.ceil(paragraphStyles.length / pageSize);
  const visible = compact ? paragraphStyles.slice(page * pageSize, page * pageSize + pageSize) : paragraphStyles;
  return <div className={`styles-gallery ${compact ? 'compact' : ''}`} role="group" aria-label={en.ribbon.styles}>
    {compact && <button type="button" className="icon-button styles-arrow" aria-label={en.ui.stylesPrevious} title={en.ui.stylesPrevious} disabled={page === 0} onClick={() => { setPage(Math.max(0, page - 1)); }}><Icon name="chevronRight" className="rotate-180" /></button>}
    <div className="styles-thumbnails">{visible.map((style) => <button key={style.label} type="button" className={`style-preview style-${style.label.toLowerCase().replaceAll(' ', '-')} ${'className' in style ? style.className ?? '' : ''}`} aria-label={style.label} title={style.label} onClick={() => { onApply(style.id, 'className' in style ? style.className : undefined); }}><span className="style-sample" aria-hidden="true">Aa</span><span className="style-name">{style.label}</span></button>)}</div>
    {compact && <button type="button" className="icon-button styles-arrow" aria-label={en.ui.stylesNext} title={en.ui.stylesNext} disabled={page >= pages - 1} onClick={() => { setPage(Math.min(pages - 1, page + 1)); }}><Icon name="chevronRight" /></button>}
    {compact && <button type="button" className="icon-button styles-expand" aria-label={en.ui.stylesExpand} title={en.ui.stylesExpand} onClick={onExpand}><Icon name="expand" /></button>}
  </div>;
}
