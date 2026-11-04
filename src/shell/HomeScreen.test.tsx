import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen, formatRecentDate, visibleVirtualRange } from './HomeScreen';
import { resetShellStore, useShellStore } from './store';
beforeEach(() => { resetShellStore(); });
const recent = { id: 'r1', title: 'Project notes', path: '/documents/notes.docx', appType: 'writer' as const, templateId: 'notes', modifiedAt: Date.UTC(2025, 5, 10, 10) };
describe('HomeScreen', () => {
  it('renders blank and six original templates, and opens a blank Writer tab', async () => {
    render(<HomeScreen />); expect(screen.getByRole('button', { name: 'Blank document', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a document: Resume' })).toBeInTheDocument(); expect(screen.getByRole('heading', { level: 1 }).textContent).toMatchInlineSnapshot('"Make room for a good idea."');
    await userEvent.click(screen.getByRole('button', { name: 'Blank document', exact: true })); expect(useShellStore.getState().tabs).toHaveLength(1);
  });
  it('opens meaningful starter content and filters templates', async () => {
    render(<HomeScreen />); await userEvent.click(screen.getByRole('button', { name: 'Create a document: Meeting notes' }));
    expect(useShellStore.getState().tabs[0]).toMatchObject({ templateId: 'notes', title: 'Meeting notes' }); expect(useShellStore.getState().tabs[0]?.content).toContain('Action items');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search templates' }), { target: { value: 'resume' } }); expect(screen.getByRole('button', { name: 'Create a document: Resume' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Create a document: Meeting notes' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } }); expect(screen.getByText('No templates match your search.')).toBeInTheDocument();
  });
  it('has real disabled file opening and navigates between sections', async () => {
    render(<HomeScreen />); expect(screen.getByRole('button', { name: 'Open', exact: true })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Recent', exact: true })); expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Home', exact: true })); await userEvent.click(screen.getByRole('button', { name: 'New', exact: true })); expect(useShellStore.getState().tabs).toHaveLength(1);
  });
  it('virtualizes twenty recents, removes one and supports injected opening', async () => {
    useShellStore.getState().replaceRecents(Array.from({ length: 20 }, (_, index) => ({ ...recent, id: `r${index}`, title: `Document ${index}`, path: `/document-${index}.docx`, modifiedAt: recent.modifiedAt + index })));
    const onOpenRecent = vi.fn(); render(<HomeScreen onOpenRecent={onOpenRecent} now={recent.modifiedAt} />);
    expect(screen.getAllByRole('listitem').length).toBeLessThan(20);
    await userEvent.click(screen.getByRole('button', { name: 'Open recent document: Document 19' })); expect(onOpenRecent).toHaveBeenCalledWith(expect.objectContaining({ id: 'r19' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove from recent files: Document 19' })); expect(useShellStore.getState().recents).toHaveLength(19);
    const list = screen.getByRole('list'); Object.defineProperty(list, 'scrollTop', { configurable: true, value: 1000 }); fireEvent.scroll(list); expect(screen.getByRole('button', { name: 'Open recent document: Document 4' })).toBeInTheDocument();
  });
  it('disables recent opening until file support is available', () => {
    useShellStore.getState().addRecent(recent); render(<HomeScreen />); expect(screen.getByRole('button', { name: 'Open recent document: Project notes' })).toBeDisabled();
    expect(within(screen.getByRole('list')).getByRole('listitem')).toBeInTheDocument();
  });
  it('computes virtual ranges and readable dates', () => {
    expect(visibleVirtualRange(-10, 288, 20)).toEqual({ start: 0, end: 6 }); expect(visibleVirtualRange(720, 288, 20)).toEqual({ start: 8, end: 16 }); expect(visibleVirtualRange(10000, 288, 20)).toEqual({ start: 20, end: 20 });
    expect(formatRecentDate(recent.modifiedAt, recent.modifiedAt, 'en-US')).toMatch(/\d/); expect(formatRecentDate(recent.modifiedAt, Date.UTC(2025, 5, 12), 'en-US')).toContain('Jun'); expect(formatRecentDate(recent.modifiedAt, Date.UTC(2026, 5, 12), 'en-US')).toContain('2025');
  });
});
