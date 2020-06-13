import * as lib from './index';

it('should stringify markdown string', () => {
  const result = lib.stringifyMarkdown('# hello');
  expect(result).toBe(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="">
</head>
<body>
<h1>hello</h1>
</body>
</html>
`);
});
