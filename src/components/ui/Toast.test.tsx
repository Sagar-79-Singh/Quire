import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';
function Trigger() { const notify = useToast(); return <><button onClick={() => { notify('Saved', 'success'); }}>Success</button><button onClick={() => { notify('Failed'); }}>Error</button></>; }
afterEach(() => { vi.useRealTimers(); });
describe('Toast', () => {
  it('shows accessible feedback and dismisses it', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Error' })); expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot('"Failed"');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' })); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('automatically expires messages and bounds the queue', async () => {
    vi.useFakeTimers(); render(<ToastProvider><Trigger /></ToastProvider>);
    act(() => { for (let index = 0; index < 6; index++) fireEvent.click(screen.getByRole('button', { name: 'Success' })); });
    expect(screen.getAllByRole('status')).toHaveLength(4);
    act(() => { vi.advanceTimersByTime(6000); }); expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('requires a provider', () => { expect(() => render(<Trigger />)).toThrow('ToastProvider'); });
});
