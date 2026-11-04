import { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { appRegistry, availableApps } from './appRegistry';
import { ToastProvider } from '../components/ui/Toast';
import { ThemeProvider } from '../theme/ThemeProvider';
describe('app registry', () => {
  it('exposes only Writer while reserving typed future app slots', () => {
    expect(availableApps.map((app) => app.id)).toEqual(['writer']); expect(appRegistry.sheets.available).toBe(false); expect(appRegistry.slides.available).toBe(false);
    expect(availableApps.map((app) => app.name).join('|')).toMatchInlineSnapshot('"Writer"');
  });
  it('lazy loads Writer and the inaccessible coming-soon component', async () => {
    const Writer = appRegistry.writer.component; render(<ToastProvider><ThemeProvider><Suspense fallback="Loading"><Writer /></Suspense></ThemeProvider></ToastProvider>); await waitFor(() => { expect(screen.queryByText('Loading')).not.toBeInTheDocument(); });
    const Sheets = appRegistry.sheets.component; render(<Suspense fallback="Loading"><Sheets /></Suspense>); expect(await screen.findByRole('button', { name: 'Coming soon in an update' })).toBeDisabled();
  });
});
