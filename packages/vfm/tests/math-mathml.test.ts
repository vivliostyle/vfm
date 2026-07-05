import { test, expect } from 'vitest';
import { stringify } from '../src/index.js';

const options = {
  partial: true,
  disableFormatHtml: true,
  mathRenderer: 'mathml' as const,
};

test('inline: $...$ becomes inline <math>', () => {
  const received = stringify('text$x = y$text', options);
  const expected =
    '<p>text<math><mrow><mi>x</mi><mo>=</mo><mi>y</mi></mrow></math>text</p>';
  expect(received).toBe(expected);
});

test('inline: single-line $$...$$ stays inline (remark-math parity)', () => {
  const received = stringify('text$$a$$text', options);
  const expected = '<p>text<math><mi>a</mi></math>text</p>';
  expect(received).toBe(expected);
});

test('display: flow $$ on its own lines becomes block <math>', () => {
  const received = stringify('$$\nx = y\n$$', options);
  const expected =
    '<math display="block" class="tml-display" style="display:block math;"><mrow><mi>x</mi><mo>=</mo><mi>y</mi></mrow></math>';
  expect(received).toBe(expected);
});

test('display: block math is lifted out of the paragraph', () => {
  const received = stringify('before\n\n$$\nx=y\n$$\n\nafter', options);
  const expected = `<p>before</p>
<math display="block" class="tml-display" style="display:block math;"><mrow><mi>x</mi><mo>=</mo><mi>y</mi></mrow></math>
<p>after</p>`;
  expect(received).toBe(expected);
});

test('inline and display together', () => {
  const received = stringify('inline: $x = y$\n\n$$\n1 + 1 = 2\n$$', options);
  const expected = `<p>inline: <math><mrow><mi>x</mi><mo>=</mo><mi>y</mi></mrow></math></p>
<math display="block" class="tml-display" style="display:block math;"><mrow><mn>1</mn><mo>+</mo><mn>1</mn><mo>=</mo><mn>2</mn></mrow></math>`;
  expect(received).toBe(expected);
});

test('does not convert math syntax inside a raw HTML block', () => {
  // The conversion lives in the mdast->hast handlers, so `$$...$$` that is part
  // of the user's raw HTML (an opaque `html` node) is left verbatim.
  const received = stringify('<div>$$x = y$$</div>', options);
  expect(received).toBe('<div>$$x = y$$</div>');
});

test('parse error falls back to a temml error span', () => {
  const received = stringify('$\\frac{$', options);
  expect(received).toContain('class="temml-error"');
  expect(received).not.toContain('<math');
});

test('does not inject the MathJax <script>', () => {
  const received = stringify('$x=y$', {
    mathRenderer: 'mathml',
    disableFormatHtml: true,
  });
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p><math><mrow><mi>x</mi><mo>=</mo><mi>y</mi></mrow></math></p>
</body>
</html>
`;
  expect(received).toBe(expected);
});

test('hand-written <math> passes through without a <script>', () => {
  const md = '- MathML: <math><mi>x</mi><mo>=</mo><mi>y</mi></math>.';
  const received = stringify(md, {
    mathRenderer: 'mathml',
    disableFormatHtml: true,
  });
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<ul>
<li>MathML: <math><mi>x</mi><mo>=</mo><mi>y</mi></math>.</li>
</ul>
</body>
</html>
`;
  expect(received).toBe(expected);
});

test('enable via frontmatter `vfm.mathRenderer: mathml`', () => {
  const md = `---
vfm:
  mathRenderer: mathml
---
$x=y$
`;
  const received = stringify(md, { disableFormatHtml: true, partial: true });
  const expected =
    '<p><math><mrow><mi>x</mi><mo>=</mo><mi>y</mi></mrow></math></p>';
  expect(received).toBe(expected);
});

test("`mathRenderer: 'mathjax'` keeps the legacy MathJax output", () => {
  const received = stringify('$x = y$', {
    mathRenderer: 'mathjax',
    partial: true,
    disableFormatHtml: true,
  });
  const expected =
    '<p><span class="math inline" data-math-typeset="true">\\(x = y\\)</span></p>';
  expect(received).toBe(expected);
});

test('`math: false` disables math regardless of renderer', () => {
  const received = stringify('$x = y$', {
    math: false,
    mathRenderer: 'mathml',
    partial: true,
    disableFormatHtml: true,
  });
  expect(received).toBe('<p>$x = y$</p>');
});
