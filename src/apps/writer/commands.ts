export interface WriterCommand { name: string; value?: string; }
export type CommandHandler = (command: WriterCommand) => void;
export function createCommandBus() {
  const handlers = new Set<CommandHandler>();
  return {
    subscribe: (handler: CommandHandler): (() => void) => { handlers.add(handler); return () => { handlers.delete(handler); }; },
    dispatch: (name: string, value?: string): void => { for (const handler of handlers) handler({ name, value }); },
    get size(): number { return handlers.size; },
  };
}
export const writerCommands = createCommandBus();
export const fontFamilies = ['Arial', 'Calibri', 'Cambria', 'Georgia', 'Helvetica', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Courier New'] as const;
export function normalizeSystemFonts(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((font) => typeof font !== 'string')) throw new TypeError('System fonts must be an array of strings.');
  const unique = new Map<string, string>();
  for (const raw of value as string[]) {
    const font = raw.trim().replace(/^"(.+)"$/, '$1').trim();
    const key = font.toLocaleLowerCase('en-US');
    if (font && !unique.has(key)) unique.set(key, font);
  }
  return Array.from(unique.values()).sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
}
export const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72] as const;
export const symbols = ['©', '®', '™', '§', '¶', '†', '‡', '•', '…', '—', '–', '€', '£', '¥', '₹', '±', '×', '÷', '≠', '≈', '≤', '≥', '∞', 'α', 'β', 'π', 'Σ', '√', '°', '←', '→', '↔'] as const;
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index] ?? ''; if (char === '"') { if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted; } else if (char === ',' && !quoted) { row.push(field); field = ''; } else if (char === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; } else field += char; }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = (rows.shift() ?? []).map((value) => value.trim());
  return rows.filter((cells) => cells.some((cell) => cell.trim())).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}
