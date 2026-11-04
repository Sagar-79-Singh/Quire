export type PaperSize = 'a4' | 'letter' | 'legal';
export type Orientation = 'portrait' | 'landscape';
export type ShapeKind = 'rect' | 'circle' | 'line' | 'arrow' | 'rounded';
export interface PageSettings {
  paper: PaperSize; orientation: Orientation;
  margins: { top: number; right: number; bottom: number; left: number };
  columns: number; columnGap: number; lineNumbers: boolean; hyphenation: boolean;
  background: string; watermark: string; theme: string; font: string; color: string;
  paragraphSpacing: number; header: string; footer: string;
  pageNumber: { position: 'header' | 'footer'; format: 'number' | 'page-of' | 'roman'; alignment: 'left' | 'center' | 'right' };
}
export interface WriterComment { id: string; text: string; author: string; createdAt: number; resolved: boolean; }
export interface TrackedChange { id: string; kind: 'insert' | 'delete'; html: string; author: string; createdAt: number; }
export const paperDimensions: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 }, letter: { width: 816, height: 1056 }, legal: { width: 816, height: 1344 },
};
export const defaultSettings: PageSettings = {
  paper: 'letter', orientation: 'portrait', margins: { top: 96, right: 96, bottom: 96, left: 96 },
  columns: 1, columnGap: 48, lineNumbers: false, hyphenation: false, background: '', watermark: '',
  theme: 'default', font: 'Arial', color: '#2B579A', paragraphSpacing: 8, header: '', footer: '',
  pageNumber: { position: 'footer', format: 'number', alignment: 'center' },
};
export const marginPresets = {
  normal: { top: 96, right: 96, bottom: 96, left: 96 },
  narrow: { top: 48, right: 48, bottom: 48, left: 48 },
  moderate: { top: 96, right: 72, bottom: 96, left: 72 },
  wide: { top: 96, right: 144, bottom: 96, left: 144 },
};
export const documentThemes = [
  { id: 'default', name: 'Quire', font: 'Arial', color: '#2B579A', spacing: 8 },
  { id: 'classic', name: 'Classic', font: 'Georgia', color: '#243B53', spacing: 10 },
  { id: 'modern', name: 'Modern', font: 'Verdana', color: '#31708E', spacing: 12 },
  { id: 'editorial', name: 'Editorial', font: 'Times New Roman', color: '#72523E', spacing: 8 },
  { id: 'fresh', name: 'Fresh', font: 'Trebuchet MS', color: '#3B746B', spacing: 10 },
  { id: 'minimal', name: 'Minimal', font: 'Helvetica', color: '#444444', spacing: 6 },
] as const;
export function pageDimensions(settings: PageSettings): { width: number; height: number; contentWidth: number; contentHeight: number } {
  const base = paperDimensions[settings.paper];
  const width = settings.orientation === 'portrait' ? base.width : base.height;
  const height = settings.orientation === 'portrait' ? base.height : base.width;
  return { width, height, contentWidth: Math.max(96, width - settings.margins.left - settings.margins.right), contentHeight: Math.max(96, height - settings.margins.top - settings.margins.bottom) };
}
export function escapeHtml(text: string): string { return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char); }
export function textToHtml(text: string): string { return text.split(/\n\n+/).map((line, index) => index === 0 && text.length > 0 ? `<h1>${escapeHtml(line)}</h1>` : `<p>${escapeHtml(line) || '<br>'}</p>`).join('') || '<p><br></p>'; }
export function htmlToText(html: string): string {
  return html.replace(/<br\s*\/?\s*>|<\/(?:p|div|h[1-6|li|tr|blockquote)>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n').trim();
}
const allowedTags = new Set(['P', 'DIV', 'BR', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'SUB', 'SUP', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TITLE', 'SUBTITLE', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'IMG', 'A', 'HR', 'INS', 'DEL', 'FIGURE', 'FIGCAPTION', 'SVG', 'PATH', 'RECT', 'CIRCLE', 'LINE', 'POLYLINE', 'POLYGON', 'TEXT', 'SUP']);
const allowedStyles = new Set(['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-align', 'vertical-align', 'margin-left', 'margin-top', 'margin-bottom', 'line-height', 'width', 'height', 'max-width', 'border', 'border-collapse', 'padding', 'fill', 'stroke', 'stroke-width', 'display']);
export function sanitizeHtml(html: string, parse: (html: string) => Document = (value) => new DOMParser().parseFromString(value, 'text/html')): string {
  const doc = parse(`<body>${html}</body>`);
  const clean = (node: Element): void => {
    for (const child of Array.from(node.children)) {
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].includes(child.tagName)) { child.remove(); continue; }
      if (!allowedTags.has(child.tagName)) { child.replaceWith(...Array.from(child.childNodes)); continue; }
      for (const attr of Array.from(child.attributes)) {
        if (attr.name.startsWith('on') || attr.name === 'srcdoc' || attr.name === 'style' && /url\s*\(|expression|javascript:/i.test(attr.value)) child.removeAttribute(attr.name);
        else if (attr.name === 'href' && !/^(https?:|mailto:|#)/i.test(attr.value)) child.removeAttribute(attr.name);
        else if (attr.name === 'src' && !/^data:image\/(png|jpeg|gif|webp);base64,/i.test(attr.value)) child.removeAttribute(attr.name);
        else if (!['style', 'href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'data-block', 'data-shape', 'data-comment', 'data-change', 'data-author', 'data-time', 'data-footnote', 'data-citation', 'contenteditable', 'viewbox', 'd', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'points', 'xmlns', 'target', 'rel'].includes(attr.name.toLowerCase())) child.removeAttribute(attr.name);
      }
      if (child.hasAttribute('style')) {
        const element = child as HTMLElement;
        for (const property of Array.from(element.style)) if (!allowedStyles.has(property)) element.style.removeProperty(property);
      }
      if (child.tagName === 'A') { child.setAttribute('rel', 'noopener noreferrer'); child.setAttribute('target', '_blank'); }
      clean(child);
    }
  };
  clean(doc.body); return doc.body.innerHTML;
}
export function shapeHtml(kind: ShapeKind, color = '#2B579A'): string {
  const shape = kind === 'circle' ? '<circle cx="80" cy="50" rx="70" ry="45" />' : kind === 'line' ? '<line x1="5" y1="50" x2="155" y2="50" />' : kind === 'arrow' ? '<path d="M5 50H145M125 30l20 20-20 20" />' : `<rect x="5" y="5" width="150" height="90" rx="${kind === 'rounded' ? 14 : 0}" />`;
  return `<figure data-shape="${kind}" contenteditable="false" style="width:180px;height:110px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" width="160" height="100" fill="${color}22" stroke="${color}" stroke-width="2">${shape}</svg></figure><p><br></p>`;
}
export function tableHtml(rows: number, columns: number): string {
  const r = Math.min(20, Math.max(1, Math.round(rows))); const c = Math.min(10, Math.max(1, Math.round(columns)));
  return `<table><tbody>${Array.from({ length: r }, () => `<tr>${Array.from({ length: c }, () => '<td><p><br></p></td>').join('')}</tr>`).join('')}</tbody></table><p><br></p>`;
}
export function pageNumberText(page: number, total: number, format: PageSettings['pageNumber']['format']): string {
  if (format === 'page-of') return `${page} / ${total}`;
  if (format === 'roman') { const values: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let n = page; let out = ''; for (const [value, symbol] of values) while (n >= value) { out += symbol; n -= value; } return out.toLowerCase(); }
  return String(page);
}
