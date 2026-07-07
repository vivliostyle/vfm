import type * as hast from 'hast';
import { describe, expect, test } from 'vitest';
import { buildElement, type ElementFactory } from '../src/index.js';

describe('buildElement', () => {
  test('with no customizer, emits the structural props on the given tag', () => {
    const el = buildElement('td', { id: 's' }, [], undefined);
    expect(el.tagName).toBe('td');
    expect(el.properties).toMatchObject({ id: 's' });
  });

  test('with a Properties customizer, user props win over structural', () => {
    const el = buildElement('td', { id: 's' }, [], { id: 'u' });
    expect(el.tagName).toBe('td');
    expect(el.properties).toMatchObject({ id: 'u' });
  });

  test('with a Factory using a tag-less shorthand, substitutes the caller tag', () => {
    const factory: ElementFactory<'th', hast.Properties> = (h) => h('.cell');
    const el = buildElement('th', {}, [], factory);
    expect(el.tagName).toBe('th');
    expect(el.properties?.className).toEqual(['cell']);
  });

  test('with a Factory naming an explicit tag, preserves it over the caller tag', () => {
    const el = buildElement<'th' | 'td', hast.Properties>('th', {}, [], (h) =>
      h('td'),
    );
    expect(el.tagName).toBe('td');
  });
});
