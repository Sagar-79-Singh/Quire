import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TabBar } from './TabBar';
import { resetShellStore, useShellStore } from './store';
beforeEach(() => { resetShellStore(); useShellStore.getState().openDocument({ title: 'First' }); useShellStore.getState().openDocument({ title: 'Second' }); });
describe('TabBar', () => {
  it('switches and closes tabs without mixing names', async () => {
    render(<TabBar />); expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true'); expect(Array.from(screen.getAllByRole('tab')).map((tab) => tab.textContent).join('|')).toMatchInlineSnapshot('"First|Second"');
    await userEvent.click(screen.getByRole('tab', { name: 'First' })); expect(useShellStore.getState().activeId).toBe(useShellStore.getState().tabs[0]?.id);
    await userEvent.click(screen.getByRole('button', { name: 'Close document: First' })); expect(screen.queryByRole('tab', { name: 'First' })).not.toBeInTheDocument();
  });
  it('navigates by keyboard, creates a tab and returns home', async () => {
    render(<TabBar />); screen.getByRole('tab', { name: 'Second' }).focus(); await userEvent.keyboard('{ArrowRight}'); expect(useShellStore.getState().activeId).toBe(useShellStore.getState().tabs[0]?.id);
    await userEvent.keyboard('{End}'); expect(useShellStore.getState().activeId).toBe(useShellStore.getState().tabs[1]?.id);
    await userEvent.keyboard('{Home}'); expect(useShellStore.getState().activeId).toBe(useShellStore.getState().tabs[0]?.id);
    await userEvent.keyboard('{ArrowLeft}'); expect(useShellStore.getState().activeId).toBe(useShellStore.getState().tabs[1]?.id);
    await userEvent.click(screen.getByRole('button', { name: 'New document' })); expect(useShellStore.getState().tabs).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Home' })); expect(useShellStore.getState().activeId).toBeNull();
  });
  it('is absent with no documents', () => { resetShellStore(); const { container } = render(<TabBar />); expect(container).toBeEmptyDOMElement(); });
});
