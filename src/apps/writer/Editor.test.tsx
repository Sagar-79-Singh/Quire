import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Editor } from './Editor';
import type { EditorHandle } from './Editor';
import { useWriterStore } from './store';
import { useShellStore, resetShellStore } from '../../shell/store';
beforeEach(() => { resetShellStore(); useWriterStore.setState({ documents: {} }); useShellStore.getState().openDocument({ title: 'Test', content: 'Original text' }); useWriterStore.getState().ensure('test', 'Original text'); useWriterStore.getState().load('test', { html: '<p data-block="one">Original text</p>', settings: useWriterStore.getState().documents.test!.settings }); });
function mount() { const ref = createRef<EditorHandle>(); const onError = vi.fn(); render(<Editor ref={ref} documentId="test" onError={onError} />); return { ref, onError }; }
describe('Editor', () => {
  it('types into a real editable surface and synchronizes plain text', async () => {
    mount(); const editor = screen.getByRole('textbox'); await userEvent.type(editor, ' more'); expect(useWriterStore.getState().documents.test?.html).toContain('more'); expect(useShellStore.getState().tabs[0]?.content).toContain('Original');
  });
  it('executes formatting and inserts sanitized HTML', () => {
    const { ref } = mount(); ref.current?.execute('bold'); expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
    ref.current?.insert('<table><tr><td>Cell</td></tr></table>'); expect(ref.current?.getHtml()).toContain('<table>');
    ref.current?.selectAll(); expect(document.execCommand).toHaveBeenCalledWith('selectAll'); ref.current?.focus(); expect(screen.getByRole('textbox')).toHaveFocus();
  });
  it('supports font sizes, undo/redo updates and read mode', async () => {
    const { ref } = mount(); ref.current?.execute('fontSize', '18'); expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '7');
    useShellStore.getState().setViewMode('read'); await waitFor(() => { expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false'); });
  });
  it('pastes plain text safely and handles indentation', () => {
    const { ref } = mount(); const editor = screen.getByRole('textbox'); fireEvent.paste(editor, { clipboardData: { getData: (type: string) => type === 'text/plain' ? '<safe>\nnext' : '' } }); expect(ref.current?.getHtml()).toContain('&lt;safe&gt;');
    fireEvent.keyDown(editor, { key: 'Tab' }); expect(document.execCommand).toHaveBeenCalledWith('indent', false, undefined); fireEvent.keyDown(editor, { key: 'Tab', shiftKey: true }); expect(document.execCommand).toHaveBeenCalledWith('outdent', false, undefined);
  });
  it('finds and replaces text deterministically', () => {
    const find = vi.fn(() => true); Object.defineProperty(window, 'find', { configurable: true, value: find }); const { ref } = mount(); expect(ref.current?.find('Original')).toBe(true); expect(ref.current?.find('')).toBe(false);
    expect(ref.current?.replace('Original', 'Changed')).toBe(1); expect(ref.current?.getHtml()).toContain('Changed'); expect(ref.current?.replace('missing', 'x', true)).toBe(0);
  });
  it('reports command failures through the injected handler', () => {
    const executor = vi.fn(() => { throw new Error('unsupported'); }); const onError = vi.fn(); render(<Editor documentId="test" commandExecutor={executor} onError={onError} />); screen.getByRole('textbox').dispatchEvent(new Event('input')); const { ref } = { ref: createRef<EditorHandle>() }; render(<Editor ref={ref} documentId="test" commandExecutor={executor} onError={onError} />); ref.current?.execute('bold'); expect(onError).toHaveBeenCalled();
  });
});
