import { describe, expect, it } from 'vitest';
import { filterTemplates, starterTemplates, templateContent } from './templates';
describe('starter templates', () => {
  it('provides six distinct, populated templates', () => {
    expect(starterTemplates).toHaveLength(6);
    expect(new Set(starterTemplates.map((template) => template.id)).size).toBe(6);
    starterTemplates.forEach((template) => { expect(templateContent(template)).toContain(template.heading); expect(template.lines.length).toBeGreaterThan(1); });
  });
  it('searches names and descriptions without case sensitivity', () => {
    expect(filterTemplates('  RESUME  ').map((template) => template.id)).toEqual(['resume']);
    expect(filterTemplates('conversation').map((template) => template.id)).toEqual(['notes']);
    expect(filterTemplates('')).toHaveLength(6);
    expect(filterTemplates('not-a-template')).toEqual([]);
  });
});
