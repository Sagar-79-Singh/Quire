import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { en } from '../../i18n/en';
import { escapeHtml, htmlToText, marginPresets, tableHtml } from './model';
import type { PageSettings } from './model';
import { symbols } from './commands';
import type { EditorHandle } from './Editor';
export type DialogKind = 'table' | 'link' | 'image' | 'header' | 'footer' | 'pageNumber' | 'watermark' | 'margins' | 'columns' | 'paragraph' | 'find' | 'replace' | 'wordCount' | 'spelling' | 'comment' | 'compare' | 'citation' | 'footnote' | 'endnote' | 'caption' | 'index' | 'envelope' | 'labels' | 'merge' | 'zoom' | 'help' | 'about' | 'shortcuts' | 'symbol' | 'date' | 'equation' | 'textBox';
export interface WriterDialogsProps { kind: DialogKind; onClose: () => void; editor: EditorHandle | null; settings: PageSettings; onSettings: (patch: Partial<PageSettings>) => void; onInsert: (html: string) => void; onNotify: (message: string) => void; onComment: (text: string) => void; onZoom: (value: number) => void; zoom: number; html: string; }
interface Field { key: string; label: string; value: string; type?: 'number' | 'color' | 'textarea'; min?: number; max?: number; }
export function WriterDialogs(props: WriterDialogsProps) {
  const { kind, onClose, editor, settings, onSettings, onInsert, onNotify, onComment, onZoom, zoom, html } = props;
  const defaults: Record<string, string> = { rows: '3', columns: '3', address: 'https://', displayText: '', imageUrl: '', textValue: '', top: String(settings.margins.top / 96), bottom: String(settings.margins.bottom / 96), left: String(settings.margins.left / 96), right: String(settings.margins.right / 96), header: settings.header, footer: settings.footer, watermark: settings.watermark, position: settings.pageNumber.position, alignment: settings.pageNumber.alignment, format: settings.pageNumber.format, columnCount: String(settings.columns), spacingBefore: '0', spacingAfter: String(settings.paragraphSpacing), lineHeight: '1.5', find: '', replacement: '', word: '', comment: '', original: '', revised: '', title: '', author: 'Sagar', year: '2025', caption: '', term: '', recipient: '', addressBlock: '', size: 'DL', labelRows: '8', labelColumns: '3', percent: String(zoom), equation: 'x = (-b ± √(b² - 4ac)) / 2a' };
  const [values, setValues] = useState(defaults); const [message, setMessage] = useState('');
  const value = (key: string): string => values[key] ?? '';
  const set = (key: string, next: string): void => { setValues((old) => ({ ...old, [key]: next })); };
  const text = (key: string, label: string, type: Field['type'] = undefined, min?: number, max?: number): ReactNode => <label className="form-field"><span>{label}</span>{type === 'textarea' ? <textarea value={value(key)} onChange={(event) => { set(key, event.target.value); }} rows={4} /> : <input type={type ?? 'text'} value={value(key)} min={min} max={max} step={type === 'number' ? '0.25' : undefined} onChange={(event) => { set(key, event.target.value); }} />}</label>;
  const select = (key: string, label: string, options: [string, string][]): ReactNode => <label className="form-field"><span>{label}</span><select value={value(key)} onChange={(event) => { set(key, event.target.value); }}>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
  const titles: Record<DialogKind, string> = { table: en.writer.table, link: en.writer.link, image: en.writer.picture, header: en.writer.header, footer: en.writer.footer, pageNumber: en.writer.pageNumber, watermark: en.writer.watermark, margins: en.writer.customMargins, columns: en.writer.columns, paragraph: en.writer.paragraphDialog, find: en.writer.find, replace: en.writer.replace, wordCount: en.writer.wordCount, spelling: en.writer.spelling, comment: en.writer.newComment, compare: en.writer.compare, citation: en.writer.citation, footnote: en.writer.footnote, endnote: en.writer.endnote, caption: en.writer.caption, index: en.writer.indexEntry, envelope: en.writer.envelope, labels: en.writer.labels, merge: en.writer.mergeFinish, zoom: en.writer.zoomDialog, help: en.writer.help, about: en.writer.about, shortcuts: en.writer.shortcuts, symbol: en.writer.symbol, date: en.writer.date, equation: en.writer.equation, textBox: en.writer.textBox };
  const apply = (event?: FormEvent): void => {
    event?.preventDefault();
    try {
      switch (kind) {
        case 'table': onInsert(tableHtml(Number(value('rows')), Number(value('columns')))); break;
        case 'link': if (!/^https?:\/\/\S+$/i.test(value('address')) && !/^mailto:\S+$/i.test(value('address'))) throw new Error(en.writer.required); onInsert(`<a href="${escapeHtml(value('address'))}">${escapeHtml(value('displayText') || value('address'))}</a>`); break;
        case 'image': if (!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(value('imageUrl'))) throw new Error(en.writer.required); onInsert(`<img src="${value('imageUrl')}" alt="${escapeHtml(value('textValue') || en.writer.picture)}" />`); break;
        case 'header': onSettings({ header: value('header') }); break;
        case 'footer': onSettings({ footer: value('footer') }); break;
        case 'pageNumber': onSettings({ pageNumber: { position: value('position') as 'header' | 'footer', alignment: value('alignment') as 'left' | 'center' | 'right', format: value('format') as 'number' | 'page-of' | 'roman' } }); break;
        case 'watermark': onSettings({ watermark: value('watermark').slice(0, 60) }); break;
        case 'margins': { const margins = Object.fromEntries(['top', 'right', 'bottom', 'left'].map((key) => [key, Number(value(key)) * 96])) as PageSettings['margins']; if (Object.values(margins).some((number) => !Number.isFinite(number) || number < 0 || number > 288)) throw new Error(en.writer.invalidNumber); onSettings({ margins }); break; }
        case 'columns': onSettings({ columns: Math.min(3, Math.max(1, Number(value('columnCount')) || 1)) }); break;
        case 'paragraph': editor?.execute('paragraphSpacing', JSON.stringify({ before: Number(value('spacingBefore')), after: Number(value('spacingAfter')), lineHeight: Number(value('lineHeight')) || 1.5 })); break;
        case 'find': setMessage(editor?.find(value('find')) ? 'Match selected.' : en.editor.noMatches); return;
        case 'replace': { const count = editor?.replace(value('find'), value('replacement'), true) ?? 0; setMessage(count ? `${count} ${en.writer.replace}` : en.editor.noMatches); if (count) { onNotify(en.writer.applied); onClose(); } return; }
        case 'spelling': { const word = value('word').trim(); if (!word) throw new Error(en.writer.required); const saved = JSON.parse(localStorage.getItem('quire.dictionary') ?? '[]') as string[]; localStorage.setItem('quire.dictionary', JSON.stringify([...new Set([...saved, word])])); onNotify(en.writer.remembered); break; }
        case 'comment': if (!value('comment').trim()) throw new Error(en.writer.required); onComment(value('comment').trim()); break;
        case 'citation': onInsert(`<span data-citation="${escapeHtml(value('author'))}, ${escapeHtml(value('year'))}">(${escapeHtml(value('author'))}, ${escapeHtml(value('year'))})</span>`); break;
        case 'footnote': case 'endnote': { const number = document.querySelectorAll('[data-footnote]').length + 1; onInsert(`<sup data-footnote="${kind}">${number}</sup>`); onInsert(`<p data-note="${kind}-${number}"><small>${number}. ${escapeHtml(value('textValue'))}</small></p>`); break; }
        case 'caption': onInsert(`<p><small>${escapeHtml(value('caption'))}</small></p>`); break;
        case 'index': onInsert(`<span data-index="${escapeHtml(value('term'))}">${escapeHtml(value('term'))}</span>`); break;
        case 'envelope': onInsert(`<section data-envelope="${escapeHtml(value('size'))}"><p>${escapeHtml(value('recipient'))}</p><p>${escapeHtml(value('addressBlock')).replace(/\n/g, '<br>')}</p></section><p><br></p>`); break;
        case 'labels': { const rows = Math.min(20, Math.max(1, Number(value('labelRows')) || 1)); const columns = Math.min(5, Math.max(1, Number(value('labelColumns')) || 1)); onInsert(tableHtml(rows, columns).replaceAll('<p><br></p>', `<p>${escapeHtml(value('recipient'))}<br>${escapeHtml(value('addressBlock')).replace(/\n/g, '<br>')}</p>`)); break; }
        case 'zoom': { const percent = Number(value('percent')); if (!Number.isFinite(percent) || percent < 25 || percent > 400) throw new Error(en.writer.invalidNumber); onZoom(percent); break; }
        case 'symbol': onInsert(escapeHtml(value('textValue') || '©')); break;
        case 'date': onInsert(escapeHtml(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))); break;
        case 'equation': onInsert(`<span data-equation="true">${escapeHtml(value('equation'))}</span>`); break;
        case 'textBox': onInsert(`<blockquote data-textbox="true">${escapeHtml(value('textValue')) || en.writer.textBox}</blockquote><p><br></p>`); break;
        default: return;
      }
      onClose();
    } catch (error) { setMessage(error instanceof Error ? error.message : en.writer.required); }
  };
  const readOnly = ['wordCount', 'help', 'about', 'shortcuts', 'compare', 'merge'].includes(kind);
  const plain = htmlToText(html);
  return <Dialog title={titles[kind]} onClose={onClose} className="writer-dialog"><form onSubmit={apply}><div className="dialog-body">
    {kind === 'table' && <div className="form-grid">{text('rows', en.writer.rows, 'number', 1, 20)}{text('columns', en.writer.columns, 'number', 1, 10)}</div>}
    {kind === 'link' && <>{text('address', en.writer.address)}{text('displayText', en.writer.displayText)}</>}
    {kind === 'image' && <>{text('imageUrl', en.writer.imageUrl)}{text('textValue', 'Alternative text')}<label className="secondary-button file-picker">{en.writer.chooseImage}<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { set('imageUrl', String(reader.result)); }; reader.onerror = () => { setMessage(en.toast.image); }; reader.readAsDataURL(file); }} /></label></>}
    {(kind === 'header' || kind === 'footer') && text(kind, kind === 'header' ? en.writer.header : en.writer.footer)}
    {kind === 'pageNumber' && <>{select('position', en.writer.position, [['header', en.writer.header], ['footer', en.writer.footer]])}{select('alignment', en.writer.alignment, [['left', en.editor.left], ['center', en.editor.center], ['right', en.editor.right]])}{select('format', en.writer.format, [['number', '1, 2, 3'], ['page-of', '1 / 3'], ['roman', 'i, ii, iii']])}</>}
    {kind === 'watermark' && text('watermark', en.writer.watermark)}
    {kind === 'margins' && <><div className="preset-buttons">{Object.entries(marginPresets).map(([key, margins]) => <button type="button" key={key} className="secondary-button" onClick={() => { onSettings({ margins }); onClose(); }}>{key}</button>)}</div><div className="form-grid">{(['top', 'right', 'bottom', 'left'] as const).map((key) => <div key={key}>{text(key, en.writer[key], 'number', 0, 3)}</div>)}</div></>}
    {kind === 'columns' && select('columnCount', en.writer.columns, [['1', en.writer.columnsOne], ['2', en.writer.columnsTwo], ['3', en.writer.columnsThree]])}
    {kind === 'paragraph' && <div className="form-grid">{text('spacingBefore', en.writer.spacingBefore, 'number', 0, 100)}{text('spacingAfter', en.writer.spacingAfter, 'number', 0, 100)}{text('lineHeight', en.writer.lineHeight, 'number', 1, 3)}</div>}
    {(kind === 'find' || kind === 'replace') && <>{text('find', en.editor.findWord)}{kind === 'replace' && text('replacement', en.editor.replacement)}{kind === 'find' && <button type="button" className="secondary-button" onClick={() => { setMessage(editor?.find(value('find'), false) ? 'Match selected.' : en.editor.noMatches); }}>{en.writer.previous}</button>}</>}
    {kind === 'wordCount' && <dl className="document-statistics"><dt>{en.status.words}</dt><dd>{(plain.match(/\S+/g) ?? []).length}</dd><dt>{en.writer.characters}</dt><dd>{plain.length}</dd><dt>{en.writer.paragraphs}</dt><dd>{plain.split(/\n\s*\n/).filter(Boolean).length}</dd></dl>}
    {kind === 'spelling' && <><p>{en.writer.dictionaryNote}</p>{text('word', en.writer.dictionaryWord)}</>}
    {kind === 'comment' && text('comment', en.writer.commentText, 'textarea')}
    {kind === 'compare' && <><p>{en.writer.compareNote}</p>{text('original', en.writer.original, 'textarea')}{text('revised', en.writer.revised, 'textarea')}<h3>{en.writer.comparison}</h3><p>{value('original') === value('revised') ? 'No differences.' : value('revised') || 'Enter revised text to compare.'}</p></>}
    {kind === 'citation' && <>{text('title', en.writer.sourceTitle)}{text('author', en.writer.sourceAuthor)}{text('year', en.writer.sourceYear, 'number', 0, 9999)}</>}
    {['footnote', 'endnote', 'textBox'].includes(kind) && text('textValue', en.writer.textValue, 'textarea')}
    {kind === 'caption' && text('caption', en.writer.captionText)}
    {kind === 'index' && text('term', en.writer.indexTerm)}
    {['envelope', 'labels'].includes(kind) && <>{text('recipient', en.writer.recipientName)}{text('addressBlock', en.writer.recipientAddress, 'textarea')}{kind === 'envelope' ? select('size', en.writer.envelopeSize, [['DL', 'DL'], ['C5', 'C5'], ['C4', 'C4']]) : <div className="form-grid">{text('labelRows', en.writer.labelRows, 'number', 1, 20)}{text('labelColumns', en.writer.labelColumns, 'number', 1, 5)}</div>}</>}
    {kind === 'merge' && <p>{en.writer.mergeDocument}: use Mailings to add recipients and generate a document for each row.</p>}
    {kind === 'zoom' && text('percent', en.writer.percent, 'number', 25, 400)}
    {kind === 'symbol' && <><div className="symbol-grid">{symbols.map((symbol) => <button type="button" key={symbol} aria-label={`${en.writer.symbol} ${symbol}`} className={value('textValue') === symbol ? 'is-active' : ''} onClick={() => { set('textValue', symbol); }}>{symbol}</button>)}</div>{text('textValue', en.writer.symbol)}</>}
    {kind === 'date' && <p>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
    {kind === 'equation' && text('equation', en.writer.equation)}
    {kind === 'help' && <div className="help-topics"><p>{en.writer.helpIntro}</p>{(['Writing', 'Files', 'Privacy'] as const).map((topic) => <details key={topic}><summary>{en.writer[`help${topic}`]}</summary><p>{en.writer[`help${topic}Body`]}</p></details>)}</div>}
    {kind === 'about' && <div className="about-content"><h3>{en.app.name}</h3><p>{en.app.version}</p><p>{en.backstage.appDescription}</p><p>{en.app.by}</p><p>{en.backstage.copyright}</p><a href="https://github.com/Sagar-79-Singh/Quire" target="_blank" rel="noreferrer">GitHub · Sagar-79-Singh/Quire</a></div>}
    {kind === 'shortcuts' && <dl className="document-statistics">{[['Ctrl+N', en.tabs.newDocument], ['Ctrl+O', en.nav.open], ['Ctrl+S', en.backstage.save], ['Ctrl+Shift+S', en.backstage.saveAs], ['Ctrl+P', en.backstage.print], ['Ctrl+F', en.writer.find], ['Ctrl+H', en.writer.replace], ['Ctrl+Z', en.writer.undo], ['Ctrl+Shift+Z', en.writer.redo], ['Ctrl+B / I / U', 'Bold / Italic / Underline'], ['F7', en.writer.spelling], ['F11', en.menu.fullscreen]].map(([key, label]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{label}</dd></div>)}</dl>}
    {message && <p className="form-message" role="status">{message}</p>}
  </div><footer className="dialog-footer"><button type="button" className="secondary-button" onClick={onClose}>{readOnly ? en.dialog.close : en.common.cancel}</button>{!readOnly && <button type="submit" className="primary-button">{['find', 'replace'].includes(kind) ? en.common.select : en.writer.insert}</button>}</footer></form></Dialog>;
}
