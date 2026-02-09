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
  // In remark 13+, \| is unescaped to | before findAndReplace runs,
  // so the first unescaped | is treated as the ruby separator
  const expected = `<p><ruby>a<rt>b|c</rt></ruby></p>`;
  expect(received).toBe(expected);
});

test('Disables any inline rule in <rt>', () => {
  const received = stringify(`{a|*b*}`, options);
  // In remark 13+, *b* is parsed as emphasis before findAndReplace runs,
  // so the ruby syntax is not recognized
  const expected = `<p>{a|<em>b</em>}</p>`;
  expect(received).toBe(expected);
});

test('Nested ruby', () => {
  const received = stringify(`{{a|b}|c}`, options);
  // In remark 13+, the inner {a|b} is matched first by findAndReplace,
  // leaving the outer braces as plain text
  const expected = `<p>{<ruby>a<rt>b</rt></ruby>|c}</p>`;
  expect(received).toBe(expected);
});

test('Ruby with newline', () => {
  const received = stringify(`{a\nb|c}`, { ...options, hardLineBreaks: true });
  const expected = `<p>{a<br>\nb|c}</p>`;
  expect(received).toBe(expected);
});
