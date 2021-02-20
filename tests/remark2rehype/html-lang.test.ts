import assert from 'assert';
import { stringify } from '../../src/index';

it('undefined', () => {
  const actual = stringify('text', { disableFormatHtml: true });
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
  assert.strictEqual(actual, expected);
});

it('en', () => {
  const actual = stringify('text', { language: 'en', disableFormatHtml: true });
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
  assert.strictEqual(actual, expected);
});
