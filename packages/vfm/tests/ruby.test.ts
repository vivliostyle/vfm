import { test, expect } from 'vitest';
import { stringify } from '../src/index';

const options = {
  partial: true,
  disableFormatHtml: true,
};

test('Simple ruby', () => {
  const received = stringify(`{a|b}`, options);
  const expected = `<p><ruby>a<rt>b</rt></ruby></p>`;
  expect(received).toBe(expected);
});

test('Enables escape in ruby body', () => {
  const received = stringify(`{a\\|b|c}`, options);
  const expected = `<p><ruby>a|b<rt>c</rt></ruby></p>`;
  expect(received).toBe(expected);
});

test('Disables any inline rule in <rt>', () => {
  const received = stringify(`{a|*b*}`, options);
  const expected = `<p><ruby>a<rt>*b*</rt></ruby></p>`;
  expect(received).toBe(expected);
});

test('Nested ruby', () => {
  const received = stringify(`{{a|b}|c}`, options);
  const expected = `<p><ruby>{a<rt>b</rt></ruby>|c}</p>`;
  expect(received).toBe(expected);
});

test('Ruby with newline', () => {
  const received = stringify(`{a\nb|c}`, { ...options, hardLineBreaks: true });
  const expected = `<p>{a<br>\nb|c}</p>`;
  expect(received).toBe(expected);
});
