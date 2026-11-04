import { en } from '../../i18n/en';
export const paragraphStyles = [
  { id: 'p', label: 'Normal' }, { id: 'h1', label: 'Heading 1' }, { id: 'h2', label: 'Heading 2' }, { id: 'h3', label: 'Heading 3' },
  { id: 'h1', label: 'Title', className: 'document-title' }, { id: 'h2', label: 'Subtitle', className: 'document-subtitle' },
  { id: 'blockquote', label: 'Quote' }, { id: 'blockquote', label: 'Intense Quote', className: 'intense-quote' }, { id: 'p', label: 'List Paragraph', className: 'list-paragraph' },
] as const;
export function StylesGallery({ onApply, compact = false }: { onApply: (tag: string, className?: string) => void; compact?: boolean }) {
  return <div className={`styles-gallery ${compact ? 'compact' : ''}`} role="group" aria-label={en.ribbon.styles}>{paragraphStyles.map((style) => <button key={style.label} className={`style-preview style-${style.label.toLowerCase().replaceAll(' ', '-')} ${'className' in style ? style.className ?? '' : ''}`} aria-label={style.label} title={style.label} onClick={() => { onApply(style.id, 'className' in style ? style.className : undefined); }}>{style.label}</button>)}</div>;
}
