import { test, expect } from 'vitest';
import { stringify } from '../src/index';

test('Enable (default)', () => {
  const received = stringify(
    'あああああああああああああああああああああああああ いいいいいいいいいいいいいいいいいいいいいい ううううううううううううううううううううううううう えええええええええええええええええええええええええ おおおおおおおおおおおおおおおおおおおおおおお\n\nかきくけこ\n\nさしすせそ',
  );
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <p>あああああああああああああああああああああああああ いいいいいいいいいいいいいいいいいいいいいい ううううううううううううううううううううううううう えええええええええええええええええええええええええ おおおおおおおおおおおおおおおおおおおおおおお</p>
    <p>かきくけこ</p>
    <p>さしすせそ</p>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

test('Disable', () => {
  const received = stringify(
    'あああああああああああああああああああああああああ いいいいいいいいいいいいいいいいいいいいいい ううううううううううううううううううううううううう えええええええええええええええええええええええええ おおおおおおおおおおおおおおおおおおおおおおお\n\nかきくけこ\n\nさしすせそ',
    { disableFormatHtml: true },
  );
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>あああああああああああああああああああああああああ いいいいいいいいいいいいいいいいいいいいいい ううううううううううううううううううううううううう えええええええええええええええええええええええええ おおおおおおおおおおおおおおおおおおおおおおお</p>
<p>かきくけこ</p>
<p>さしすせそ</p>
</body>
</html>
`;
  expect(received).toBe(expected);
});
