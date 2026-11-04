import { describe, expect, it } from 'vitest';
import { buildPrintHtml, exportDocx, htmlToAst, importDocx } from './docx';
import { defaultSettings } from './model';
describe('DOCX conversion', () => {
  it('converts rich HTML into a bounded AST', () => {
    const ast = htmlToAst('<h1>Title</h1><p style="text-align:center"><b>Bold</b></p><ul><li>One</li><li>Two</li></ul><table><tr><td>A</td><td>B</td></tr></table><img src="data:image/png;base64,AA==" alt="Picture">');
    expect(ast.blocks.map((block) => block.type)).toEqual(['heading', 'paragraph', 'paragraph', 'paragraph', 'table', 'image']);
    expect(ast.blocks[1]).toMatchObject({ bold: true, align: 'center' }); expect(ast.blocks[4]?.rows).toEqual([['A', 'B']]);
    expect(htmlToAst('plain').blocks[0]?.text).toBe('plain');
  });
  it('round-trips a Quire document through DOCX with layout metadata', async () => {
    const snapshot = { html: '<h1>Round trip</h1><p>Offline text.</p><table><tr><td>Cell</td></tr></table>', settings: { ...defaultSettings, paper: 'a4' as const, header: 'Header', footer: 'Footer', watermark: 'DRAFT' } };
    const bytes = await exportDocx(snapshot, 'Round trip'); expect(bytes.byteLength).toBeGreaterThan(1000);
    const imported = await importDocx(bytes); expect(imported.html.replace(/<\/?tbody>/g, '')).toBe(snapshot.html); expect(imported.settings).toMatchObject({ paper: 'a4', header: 'Header', footer: 'Footer', watermark: 'DRAFT' });
  }, 20000);
  it('builds printable paged HTML with sanitized content', () => {
    const html = buildPrintHtml('<p onclick="alert(1)">Safe</p><script>bad()</script>', { ...defaultSettings, header: 'Report', footer: 'Private', watermark: 'DRAFT' }, 'Report');
    expect(html).toContain('@page{size:816px 1056px'); expect(html).toContain('Safe'); expect(html).toContain('DRAFT'); expect(html).not.toContain('onclick'); expect(html).not.toContain('<script>');
  });
});
