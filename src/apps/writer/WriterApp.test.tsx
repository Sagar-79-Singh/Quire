import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import WriterApp from './WriterApp';
import { ToastProvider } from '../../components/ui/Toast';
import { resetShellStore, useShellStore } from '../../shell/store';
import { useWriterStore } from './store';
beforeEach(() => { resetShellStore(); useWriterStore.setState({ documents: {} }); });
const mount = () => render(<ToastProvider><WriterApp /></ToastProvider>);
describe('Writer body', () => {
  it('renders the active editable document and isolates tabs', async () => {
    useShellStore.getState().openDocument({ title: 'First', content: 'First document' }); mount();
    expect(await screen.findByRole('textbox', { name: 'Document content' })).toHaveTextContent('First document');
    const second = useShellStore.getState().openDocument({ title: 'Second', content: 'Second document' });
    await waitFor(() => { expect(screen.getByTestId('writer-editor')).toHaveAttribute('data-document-id', second); });
    expect(screen.getByTestId('writer-editor')).toHaveTextContent('Second document');
  });
  it('wires formatting, styles and view controls', async () => {
    useShellStore.getState().openDocument({ title: 'First', content: 'Words' }); mount(); const editor = await screen.findByTestId('writer-editor'); editor.focus();
    const bold = screen.getAllByRole('button', { name: 'Bold', exact: true })[0]; if (bold) await userEvent.click(bold);
    expect(document.execCommand).toHaveBeenCalled();
    const normal = screen.getAllByRole('button', { name: 'Heading 1', exact: true })[0]; if (normal) await userEvent.click(normal);
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h1');
    await userEvent.click(screen.getAllByRole('button', { name: 'Gridlines' })[0]!); expect(screen.getByTestId('writer-canvas')).toHaveClass('with-gridlines');
    await userEvent.click(screen.getAllByRole('button', { name: 'Ruler' })[0]!); expect(screen.queryByRole('img', { name: 'Horizontal ruler' })).not.toBeInTheDocument();
  });
  it('has no body without an active document', () => { const { container } = mount(); expect(container.querySelector('.writer-app')).not.toBeInTheDocument(); });
});
