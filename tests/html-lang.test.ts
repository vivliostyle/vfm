import { test, expect } from 'vitest';
import { stringify } from '../src/index';

test('undefined', () => {
  const received = stringify('text', { disableFormatHtml: true });
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>text</p>
</body>
</html>
`;
  expect(received).toBe(expected);
});

test('en', () => {
  const received = stringify('text', {
    language: 'en',
    disableFormatHtml: true,
  });
  const expected = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>text</p>
</body>
</html>
`;
  expect(received).toBe(expected);
});
