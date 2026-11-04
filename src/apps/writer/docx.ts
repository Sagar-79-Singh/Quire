import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun, Header, Footer, PageNumber, AlignmentType, PageOrientation } from 'docx';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { defaultSettings, htmlToText, pageDimensions, sanitizeHtml } from './model';
import type { PageSettings } from './model';
import type { WriterSnapshot } from './store';

export interface DocumentAstBlock { type: 'paragraph' | 'heading' | 'table' | 'image'; text: string; level?: number; rows?: string[][]; src?: string; bold?: boolean; italic?: boolean; underline?: boolean; align?: 'left' | 'center' | 'right' | 'justify'; }
export interface DocumentAst { blocks: DocumentAstBlock[]; }
export interface DocxImport extends WriterSnapshot { title: string; warnings: string[]; }
const CUSTOM_PROPERTY = 'quireDocument';
export function htmlToAst(html: string, parse: (html: string) => Document = (value) => new DOMParser().parseFromString(value, 'text/html')): DocumentAst {
  const doc = parse(`<body>${sanitizeHtml(html)}</body>`); const blocks: DocumentAstBlock[] = [];
  const alignment = (element: Element): DocumentAstBlock['align'] => { const value = (element as HTMLElement).style.textAlign; return value === 'center' || value === 'right' || value === 'justify' ? value : 'left'; };
  for (const element of Array.from(doc.body.children)) {
    const tag = element.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) blocks.push({ type: 'heading', text: element.textContent ?? '', level: Number(tag.slice(1)), align: alignment(element) });
    else if (tag === 'table') blocks.push({ type: 'table', text: element.textContent ?? '', rows: Array.from(element.querySelectorAll('tr')).map((row) => Array.from(row.querySelectorAll('td,th')).map((cell) => cell.textContent ?? '')) });
    else if (tag === 'img' || element.querySelector('img')) { const image = tag === 'img' ? element : element.querySelector('img'); if (image) blocks.push({ type: 'image', text: image.getAttribute('alt') ?? '', src: image.getAttribute('src') ?? '' }); }
    else if (tag === 'ul' || tag === 'ol') Array.from(element.querySelectorAll('li')).forEach((item, index) => { blocks.push({ type: 'paragraph', text: `${tag === 'ol' ? `${index + 1}.` : '•'} ${item.textContent ?? ''}`, align: alignment(element) }); });
    else blocks.push({ type: 'paragraph', text: element.textContent ?? '', bold: !!element.querySelector('b,strong') || (element as HTMLElement).style.fontWeight === 'bold', italic: !!element.querySelector('i,em') || (element as HTMLElement).style.fontStyle === 'italic', underline: !!element.querySelector('u'), align: alignment(element) });
  }
  if (!blocks.length) blocks.push({ type: 'paragraph', text: htmlToText(html) });
  return { blocks };
}
function dataUriToBytes(src: string): Uint8Array | null { const match = /^data:image\/(?:png|jpeg|gif|webp);base64,(.+)$/i.exec(src); if (!match?.[1]) return null; const binary = atob(match[1]); return Uint8Array.from(binary, (char) => char.charCodeAt(0)); }
function astToChildren(ast: DocumentAst): (Paragraph | Table)[] {
  const align = (value: DocumentAstBlock['align']): (typeof AlignmentType)[keyof typeof AlignmentType] => value === 'center' ? AlignmentType.CENTER : value === 'right' ? AlignmentType.RIGHT : value === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;
  return ast.blocks.map((block) => {
    if (block.type === 'table') return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: (block.rows ?? []).map((row) => new TableRow({ children: row.map((cell) => new TableCell({ children: [new Paragraph({ children: [new TextRun(cell)] })] })) })) });
    if (block.type === 'image') { const data = block.src ? dataUriToBytes(block.src) : null; if (data) return new Paragraph({ children: [new ImageRun({ type: 'png', data, transformation: { width: 400, height: 300 } })] }); return new Paragraph({ text: block.text }); }
    const heading = block.type === 'heading' ? ([HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6][Math.min(5, Math.max(0, (block.level ?? 1) - 1))]) : undefined;
    return new Paragraph({ heading, alignment: align(block.align), children: [new TextRun({ text: block.text, bold: block.bold, italics: block.italic, underline: block.underline ? {} : undefined })] });
  });
}
export async function exportDocx(snapshot: WriterSnapshot, title: string): Promise<ArrayBuffer> {
  const size = pageDimensions(snapshot.settings); const twips = (px: number): number => Math.round(px * 15);
  const doc = new Document({
    creator: 'Sagar', lastModifiedBy: 'Sagar', title, description: 'Created with Quire',
    customProperties: [{ name: CUSTOM_PROPERTY, value: JSON.stringify({ version: 1, html: snapshot.html, settings: snapshot.settings }) }],
    sections: [{
      properties: { page: { size: { width: twips(size.width), height: twips(size.height), orientation: snapshot.settings.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: { top: twips(snapshot.settings.margins.top), right: twips(snapshot.settings.margins.right), bottom: twips(snapshot.settings.margins.bottom), left: twips(snapshot.settings.margins.left) } }, column: { count: snapshot.settings.columns, space: twips(snapshot.settings.columnGap) } },
      headers: { default: new Header({ children: [new Paragraph({ text: snapshot.settings.header, children: snapshot.settings.pageNumber.position === 'header' ? [PageNumber.CURRENT] : undefined })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: snapshot.settings.footer, children: snapshot.settings.pageNumber.position === 'footer' ? [PageNumber.CURRENT] : undefined })] }) },
      children: astToChildren(htmlToAst(snapshot.html)),
    }],
  });
  const blob = await Packer.toBlob(doc); return blob.arrayBuffer();
}
export async function importDocx(data: ArrayBuffer): Promise<DocxImport> {
  const zip = await JSZip.loadAsync(data); let stored: { html?: string; settings?: PageSettings; title?: string } = {};
  const custom = zip.file('docProps/custom.xml');
  if (custom) { const xml = await custom.async('string'); const doc = new DOMParser().parseFromString(xml, 'application/xml'); for (const property of Array.from(doc.getElementsByTagName('property'))) { if (property.getAttribute('name') === CUSTOM_PROPERTY) { try { stored = JSON.parse(property.textContent ?? '{}') as typeof stored; } catch { stored = {}; } } } }
  const result = await mammoth.convertToHtml({ arrayBuffer: data }, { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh"] });
  const html = typeof stored.html === 'string' ? sanitizeHtml(stored.html) : sanitizeHtml(result.value || '<p><br></p>');
  const settings = stored.settings && typeof stored.settings === 'object' ? { ...defaultSettings, ...stored.settings, margins: { ...defaultSettings.margins, ...stored.settings.margins } } : structuredClone(defaultSettings);
  return { title: stored.title ?? '', html, settings, warnings: result.messages.map((message) => message.message) };
}
export function buildPrintHtml(html: string, settings: PageSettings, title: string): string {
  const size = pageDimensions(settings); const safe = sanitizeHtml(html);
  const escape = (value: string): string => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>@page{size:${size.width}px ${size.height}px;margin:${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px}html,body{margin:0;padding:0;color:#202020;font-family:${escape(settings.font)},Arial,sans-serif;font-size:11pt;line-height:1.5}p{margin:0 0 ${settings.paragraphSpacing}px}h1{font-size:20pt}h2{font-size:16pt}h3{font-size:13pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px}img{max-width:100%}blockquote{border-left:3px solid ${escape(settings.color)};padding-left:16px}header,footer{position:fixed;left:0;right:0;font-size:9pt;color:#666}header{top:-40px}footer{bottom:-40px;text-align:center}.watermark{position:fixed;inset:0;display:grid;place-items:center;transform:rotate(-35deg);font-size:64px;color:#00000012;z-index:-1}ins{color:#287a3e}del{color:#b22525}</style></head><body>${settings.watermark ? `<div class="watermark">${escape(settings.watermark)}</div>` : ''}<header>${escape(settings.header)}</header><main>${safe}</main><footer>${escape(settings.footer)}</footer></body></html>`;
}
