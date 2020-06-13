import * as lib from './index';

it('should stringify markdown string into html document', () => {
  const result = lib.stringifyMarkdown('# hello');
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

it('should stringify math equation', () => {
  const result = lib.stringifyMarkdown('$$sum$$', {partial: true});
  expect(result).toContain(
    `<p><span class="math math-inline"><mjx-container class="MathJax" jax="SVG">`,
  );
});
