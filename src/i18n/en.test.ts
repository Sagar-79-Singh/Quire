import { describe, expect, it } from 'vitest';
import { en } from './en';

describe('English strings', () => {
  it('contains the product identity and six starter template names', () => { expect(en.app.author).toBe('Sagar'); expect(en.app.name).toBe('Quire'); expect(Object.keys(en.templates)).toHaveLength(12); });
  it('provides explanations for unavailable controls', () => { expect(en.title.filePending.length).toBeGreaterThan(10); expect(en.comingSoon.badge).toBe('Coming soon in an update'); });
  it('shows the current app version in the About dialog', () => { expect(en.app.version).toBe('Version 1.0.2'); });
});
