import { test, expect } from 'vitest';
import { stringify } from '../src/index';

test('Heading with attributes', () => {
  const received = stringify('# Heading {#foo}', {
    partial: true,
    disableFormatHtml: true,
  });
  const expected = `<section class="level1" aria-labelledby="foo"><h1 id="foo">Heading</h1></section>`;
  expect(received).toBe(expected);
});

test('Heading with attributes, specification by line break', () => {
  const received = stringify('# Heading\n{#foo}', {
    partial: true,
    disableFormatHtml: true,
  });
  const expected = `<section class="level1" aria-labelledby="foo"><h1 id="foo">Heading</h1></section>`;
  expect(received).toBe(expected);
});

test('Heading with attributes and inline elements, specification by line break', () => {
  const received = stringify('# Heading *test*\n{#foo}', {
    partial: true,
    disableFormatHtml: true,
  });
  const expected = `<section class="level1" aria-labelledby="foo"><h1 id="foo">Heading <em>test</em></h1></section>`;
  expect(received).toBe(expected);
});
