import { stringify } from '../src/index';

const options = {
  partial: true,
  disableFormatHtml: true,
  math: true,
};

it('inline', () => {
  const received = stringify('text$x=y$text', options);
  const expected = '<p>text\\(x=y\\)text</p>';
  expect(received).toBe(expected);
});

it('display', () => {
  const received = stringify('text$$1 + 1 = 2$$text', options);
  const expected = '<p>text$$1 + 1 = 2$$text</p>';
  expect(received).toBe(expected);
});

it('inline and display', () => {
  const received = stringify(
    'inline: $x = y$\n\ndisplay: $$1 + 1 = 2$$',
    options,
  );
  const expected = '<p>inline: \\(x = y\\)</p>\n<p>display: $$1 + 1 = 2$$</p>';
  expect(received).toBe(expected);
});

it('un-match', () => {
  const received = stringify('text$$$unmatch$$$text', options);
  const expected = '<p>text$$$unmatch$$$text</p>';
  expect(received).toBe(expected);
});

it('inline: exclusive other markdown syntax', () => {
  const received = stringify('text$**bold**$text', options);
  const expected = '<p>text\\(**bold**\\)text</p>';
  expect(received).toBe(expected);
});

it('display: exclusive other markdown syntax', () => {
  const received = stringify('text$$**bold**$$text', options);
  const expected = '<p>text$$**bold**$$text</p>';
  expect(received).toBe(expected);
});

it('HTML header and body', () => {
  const received = stringify('$x=y$', { math: true, disableFormatHtml: true });
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML"></script>
</head>
<body data-math-typeset="true">
<p>\\(x=y\\)</p>
</body>
</html>
`;
  expect(received).toBe(expected);
});

it('disable', () => {
  const markdown = `---
math: false
---
$x=y$
`;
  const received = stringify(markdown, { math: true, disableFormatHtml: true });
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>$x=y$</p>
</body>
</html>
`;
  expect(received).toBe(expected);
});
