import * as lib from './index';

it('stringify math equation', () => {
  const result = lib.stringify('$$sum$$', {partial: true});
  expect(result).toContain(
    `<p><span class="math math-inline"><mjx-container class="MathJax" jax="SVG">`,
  );
});

it('convert img to figure', () => {
  const result = lib.stringify('![fig](image.png)', {partial: true});
  expect(result).toBe(
    `<p><figure><img src="image.png" alt="fig"><figcaption>fig</figcaption></figure></p>`,
  );
});

it('stringify markdown string into html document', () => {
  const result = lib.stringify('# hello');
  expect(result).toBe(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<h1>hello</h1>
</body>
</html>
`);
});
