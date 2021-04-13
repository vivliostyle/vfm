import assert from 'assert';
import { stringify } from '../src/index';

it('Enable (default)', () => {
  const actual = stringify(
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
  assert.strictEqual(actual, expected);
});

it('Disable', () => {
  const actual = stringify(
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
  assert.strictEqual(actual, expected);
});
