import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateRibbonFit, computeRibbonOverflow, RibbonSurface } from './RibbonSurface';

const observations = new Set<ResizeObserverCallback>();
function mockWidths(width: number) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 90, top: 0, left: 0, bottom: 90, right: 100, x: 0, toJSON: () => ({}) } as DOMRect);
}
afterEach(() => { observations.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('computeRibbonOverflow', () => {
  const groups = [{ id: 'Clipboard', width: 120 }, { id: 'Font', width: 400 }, { id: 'Paragraph', width: 180 }, { id: 'Styles', width: 350 }, { id: 'Editing', width: 120 }];
  it('keeps every group visible when there is room', () => {
    expect(computeRibbonOverflow({ groups, availableWidth: 1920, minGroupWidth: 80 })).toEqual({ visible: ['Clipboard', 'Font', 'Paragraph', 'Styles', 'Editing'], hidden: [] });
  });
  it('hides by priority and returns groups in original order', () => {
    expect(computeRibbonOverflow({ groups, availableWidth: 1000, minGroupWidth: 80 }).hidden).toEqual(['Styles', 'Editing']);
    expect(computeRibbonOverflow({ groups, availableWidth: 600, minGroupWidth: 80 }).hidden).toEqual(['Paragraph', 'Styles', 'Editing']);
  });
  it('clamps natural widths to the minimum and handles empty input', () => {
    expect(computeRibbonOverflow({ groups: [{ id: 'a', width: 10 }], availableWidth: 100, minGroupWidth: 80 }).visible).toEqual(['a']);
    expect(computeRibbonOverflow({ groups: [], availableWidth: 0, minGroupWidth: 80 })).toEqual({ visible: [], hidden: [] });
  });
  it('keeps the legacy fit helper available', () => {
    expect(calculateRibbonFit([100, 100], 500)).toBe(2);
    expect(calculateRibbonFit([], 0)).toBe(0);
  });
});
describe('RibbonSurface', () => {
  it('observes container resizing and exposes hidden groups in a trapped popover', async () => {
    vi.stubGlobal('ResizeObserver', class implements ResizeObserver {
      callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) { this.callback = callback; observations.add(callback); }
      observe() {}
      unobserve() {}
      disconnect() { observations.delete(this.callback); }
    });
    mockWidths(240);
    const groups = [{ id: 'font', node: <section>Font group</section> }, { id: 'paragraph', node: <section>Paragraph group</section> }, { id: 'styles', node: <section>Styles group</section> }];
    const { unmount } = render(<RibbonSurface groups={groups} expanded />);
    const more = screen.getByRole('button', { name: 'More commands' });
    expect(more).toBeEnabled();
    await userEvent.click(more);
    expect(screen.getByRole('dialog', { name: 'More commands' })).toHaveTextContent('Styles group');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    mockWidths(500); act(() => { observations.forEach((callback) => { callback([], {} as ResizeObserver); }); });
    expect(screen.getByRole('button', { name: 'More commands' })).toBeDisabled();
    unmount(); expect(observations.size).toBe(0);
  });
  it('falls back to window resize without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined); mockWidths(500);
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<RibbonSurface groups={[{ id: 'one', node: <span>One</span> }]} />);
    act(() => { window.dispatchEvent(new Event('resize')); }); unmount(); expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
