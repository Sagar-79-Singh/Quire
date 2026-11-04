import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateRibbonFit, RibbonSurface } from './RibbonSurface';

const observations = new Set<ResizeObserverCallback>();
function mockWidths(width: number) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 90, top: 0, left: 0, bottom: 90, right: 100, x: 0, toJSON: () => ({}) } as DOMRect);
}
afterEach(() => { observations.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('RibbonSurface', () => {
  it('computes exact fit and reserves space for overflow', () => {
    expect(calculateRibbonFit([100, 100], 200)).toBe(2);
    expect(calculateRibbonFit([100, 100, 100], 240)).toBe(2);
    expect(calculateRibbonFit([300], 200)).toBe(0);
    expect(calculateRibbonFit([], 0)).toBe(0);
  });
  it('observes container resizing and exposes hidden groups', async () => {
    observations.clear();
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
    expect(screen.getByRole('button', { name: 'More commands' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More commands' })); expect(screen.getByRole('dialog', { name: 'More commands' })).toHaveTextContent('Styles group');
    await userEvent.keyboard('{Escape}');
    mockWidths(500); act(() => { observations.forEach((callback) => { callback([], {} as ResizeObserver); }); });
    expect(screen.queryByRole('button', { name: 'More commands' })).not.toBeInTheDocument();
    unmount(); expect(observations.size).toBe(0);
  });
  it('falls back to window resize without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined); mockWidths(500);
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<RibbonSurface groups={[{ id: 'one', node: <span>One</span> }]} />);
    act(() => { window.dispatchEvent(new Event('resize')); }); unmount(); expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
