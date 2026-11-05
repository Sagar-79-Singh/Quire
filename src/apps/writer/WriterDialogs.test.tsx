import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WriterDialogs } from './WriterDialogs';
import type { DialogKind, WriterDialogsProps } from './WriterDialogs';
import { defaultSettings } from './model';
function mount(kind: DialogKind, overrides: Partial<WriterDialogsProps> = {}) {
  cleanup();
  const props: WriterDialogsProps = { kind, onClose: vi.fn(), editor: { execute: vi.fn(), insert: vi.fn(), focus: vi.fn(), getHtml: () => '<p>Hello</p>', selectAll: vi.fn(), find: vi.fn(() => true), replace: vi.fn(() => 2) }, settings: defaultSettings, onSettings: vi.fn(), onInsert: vi.fn(), onNotify: vi.fn(), onComment: vi.fn(), onZoom: vi.fn(), zoom: 100, html: '<p>Hello world</p>', ...overrides };
  render(<WriterDialogs {...props} />); return props;
}
describe('Writer dialogs', () => {
  it('inserts a bounded table', async () => { const props = mount('table'); await userEvent.clear(screen.getByLabelText('Rows')); await userEvent.type(screen.getByLabelText('Rows'), '2'); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onInsert).toHaveBeenCalledWith(expect.stringContaining('<table>')); expect(props.onClose).toHaveBeenCalled(); });
  it('validates links and inserts safe anchors', async () => { const props = mount('link'); await userEvent.clear(screen.getByLabelText('Web address')); await userEvent.type(screen.getByLabelText('Web address'), 'https://github.com/Sagar-79-Singh/Quire'); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onInsert).toHaveBeenCalledWith(expect.stringContaining('href="https://github.com')); });
  it('applies page numbers, margins and zoom', async () => {
    let props = mount('pageNumber'); await userEvent.selectOptions(screen.getByLabelText('Number format'), 'roman'); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onSettings).toHaveBeenCalledWith({ pageNumber: { position: 'footer', alignment: 'center', format: 'roman' } });
    screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); props = mount('margins'); await userEvent.click(screen.getByRole('button', { name: 'narrow' })); expect(props.onSettings).toHaveBeenCalledWith({ margins: { top: 48, right: 48, bottom: 48, left: 48 } });
    screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); props = mount('zoom'); await userEvent.clear(screen.getByLabelText('Percent')); await userEvent.type(screen.getByLabelText('Percent'), '125'); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onZoom).toHaveBeenCalledWith(125);
  });
  it('finds, replaces and counts words', async () => {
    let props = mount('find'); await userEvent.type(screen.getByLabelText('Find in document'), 'Hello'); await userEvent.click(screen.getByRole('button', { name: 'Select' })); expect(props.editor?.find).toHaveBeenCalledWith('Hello');
    screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); props = mount('replace'); await userEvent.type(screen.getByLabelText('Find in document'), 'Hello'); await userEvent.click(screen.getByRole('button', { name: 'Select' })); expect(props.editor?.replace).toHaveBeenCalledWith('Hello', '', true);
    screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); mount('wordCount'); expect(screen.getByText('2')).toBeInTheDocument();
  });
  it('renders help, about and shortcut content without network calls', () => {
    mount('help'); expect(screen.getByText('Writing and formatting')).toBeInTheDocument(); screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); mount('about'); expect(screen.getByText('Version 1.0.1')).toBeInTheDocument(); screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); mount('shortcuts'); expect(screen.getByText('Ctrl+Shift+Z')).toBeInTheDocument();
  });
  it('creates comments, symbols and equations', async () => {
    let props = mount('comment'); await userEvent.type(screen.getByLabelText('Comment text'), 'Review this'); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onComment).toHaveBeenCalledWith('Review this');
    screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); props = mount('symbol'); await userEvent.click(screen.getByRole('button', { name: 'Symbol ₹' })); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onInsert).toHaveBeenCalledWith('₹');
    screen.getAllByRole('button', { name: 'Close dialog' })[0]?.click(); props = mount('equation'); await userEvent.click(screen.getByRole('button', { name: 'Insert' })); expect(props.onInsert).toHaveBeenCalledWith(expect.stringContaining('data-equation'));
  });
});
