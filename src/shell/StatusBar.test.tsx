import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { StatusBar } from './StatusBar';
import { resetShellStore, useShellStore } from './store';
beforeEach(() => { resetShellStore(); });
describe('StatusBar', () => {
  it('shows ready on home and document counts in Writer', () => {
    const { rerender } = render(<StatusBar />); expect(screen.getByText('Ready')).toBeInTheDocument();
    act(() => { useShellStore.getState().openDocument({ title: 'Notes', content: 'One two three' }); }); rerender(<StatusBar />);
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument(); expect(screen.getByText('3 words')).toBeInTheDocument();
    expect({ tag: screen.getByRole('contentinfo').tagName, className: screen.getByRole('contentinfo').className }).toMatchInlineSnapshot(`
      {
        "className": "status-bar",
        "tag": "FOOTER",
      }
    `);
  });
  it('switches all views and opens the side panel', async () => {
    useShellStore.getState().openDocument({ title: 'Notes', content: 'One' }); render(<StatusBar />);
    expect(screen.getByText('1 word')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Web layout' })); expect(useShellStore.getState().viewMode).toBe('web');
    await userEvent.click(screen.getByRole('button', { name: 'Read mode' })); expect(useShellStore.getState().viewMode).toBe('read');
    await userEvent.click(screen.getByRole('button', { name: 'Print layout' })); expect(useShellStore.getState().viewMode).toBe('print');
    await userEvent.click(screen.getByRole('button', { name: 'Show side panel' })); expect(useShellStore.getState().panelOpen).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Hide side panel' })); expect(useShellStore.getState().panelOpen).toBe(false);
  });
  it('updates zoom through slider, steps and reset, with real bounds', async () => {
    useShellStore.getState().openDocument({ title: 'Notes' }); render(<StatusBar />);
    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), { target: { value: '75' } }); expect(useShellStore.getState().zoom).toBe(75);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' })); expect(useShellStore.getState().zoom).toBe(85);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' })); expect(useShellStore.getState().zoom).toBe(75);
    await userEvent.click(screen.getByRole('button', { name: 'Reset zoom' })); expect(useShellStore.getState().zoom).toBe(100);
    act(() => { useShellStore.getState().setZoom(400); }); expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    act(() => { useShellStore.getState().setZoom(25); }); expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  });
});
