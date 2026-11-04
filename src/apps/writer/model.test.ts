import { describe, expect, it } from 'vitest';
import { defaultSettings, escapeHtml, htmlToText, pageDimensions, pageNumberText, sanitizeHtml, shapeHtml, tableHtml, textToHtml } from './model';
describe('document model', () => {
  it('maps paper sizes, orientation and safe content dimensions', () => {
    expect(pageDimensions(defaultSettings)).toMatchObject({ width: 816, height: 1056, contentWidth: 624, contentHeight: 864 });
    expect(pageDimensions({ ...defaultSettings, paper: 'a4', orientation: 'landscape' })).toMatchObject({ width: 1123, height: 794 });
    expect(pageDimensions({ ...defaultSettings, paper: 'legal' }).height).toBe(1344);
    expect(pageDimensions({ ...defaultSettings, margins: { top: 900, bottom: 900, left: 900, right: 900 } }).contentWidth).toBe(96);
  });
  it('escapes text and round-trips document paragraphs', () => {
    expect(escapeHtml('<&"\'>')).toBe('&lt;&amp;&quot;&#39;&gt;');
    expect(textToHtml('Title\n\nBody')).toBe('<h1>Title</h1><p>Body</p>');
    expect(htmlToText('<p>One &amp; two</p><p>Three</p>')).toBe('One & two\nThree');
    expect(textToHtml('')).toContain('<br>');
  });
  it('sanitizes active content and external resources', () => {
    const html = sanitizeHtml('<p onclick="alert(1)" style="color:red;position:fixed"><b>Safe</b><script>alert(1)</script><img src="https://example.com/a.png"><img src="data:image/png;base64,AA=="><a href="javascript:alert(1)">Link</a><iframe></iframe></p>');
    expect(html).toContain('<b>Safe</b>'); expect(html).toContain('color: red'); expect(html).not.toContain('onclick'); expect(html).not.toContain('script'); expect(html).not.toContain('position'); expect(html).not.toContain('https://example'); expect(html).toContain('data:image/png'); expect(html).not.toContain('javascript:');
    expect(sanitizeHtml('<custom><em>Keep</em></custom>')).toBe('<em>Keep</em>');
  });
  it('creates bounded tables and every original shape', () => {
    expect(tableHtml(2, 3).match(/<td>/g)).toHaveLength(6); expect(tableHtml(100, 100).match(/<td>/g)).toHaveLength(200); expect(tableHtml(0, 0).match(/<td>/g)).toHaveLength(1);
    for (const kind of ['rect', 'circle', 'line', 'arrow', 'rounded'] as const) expect(shapeHtml(kind)).toContain(`data-shape="${kind}"`);
  });
  it('formats page numbers', () => { expect(pageNumberText(4, 10, 'number')).toBe('4'); expect(pageNumberText(4, 10, 'page-of')).toBe('4 / 10'); expect(pageNumberText(14, 20, 'roman')).toBe('xiv'); });
});
