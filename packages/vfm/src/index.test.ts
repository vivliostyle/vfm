import * as lib from './index';

function partial(body: string) {
  return lib.stringify(body, {partial: true});
}

it.skip('handle custom attributes', () => {
  expect(
    partial(`
# Introduction {#introduction}
`),
  ).toBe(`<h1 id="introduction">Introduction</h1>`);
});

it('reject incorrect fences', () => {
  expect(
    partial(`
::::appendix
:::::nested
# Title
:::::
::::
`),
  ).toBe(
    `<p>::::appendix<br>
:::::nested</p>
<h1>Title</h1>
<p>:::::<br>
::::</p>`,
  );

  expect(
    partial(`
:::appendix
:::::nested
# Title
:::::
:::
`),
  ).toBe(
    `<div class="appendix"><p>:::::nested</p><h1>Title</h1><p>:::::</p></div>`,
  );
});

it('handle fenced block', () => {
  expect(
    partial(`
:::appendix
# Appendix
test
:::
`),
  ).toBe(`<div class="appendix"><h1>Appendix</h1><p>test</p></div>`);

  expect(
    partial(`
:::
# Plain block
:::

---

:::another
Another block
:::
`),
  ).toBe(
    `<div><h1>Plain block</h1></div>
<hr>
<div class="another"><p>Another block</p></div>`,
  );

  expect(
    partial(`
:::appendix
A

::::nested
# Title
::::
:::
`),
  ).toBe(
    `<div class="appendix"><p>A</p><div class="nested"><h1>Title</h1></div></div>`,
  );
});

it('handle hard line break', () => {
  expect(
    partial(`
a
b`),
  ).toBe(`<p>a<br>
b</p>`);
});

it('stringify math', () => {
  expect(partial('$$sum$$')).toContain(
    `<p><span class="math math-inline"><mjx-container class="MathJax" jax="SVG">`,
  );
});

it('stringify ruby', () => {
  expect(partial('{A|B}')).toBe(`<p><ruby>A<rt>B</rt></ruby></p>`);
});

it('convert img to figure', () => {
  expect(partial('![fig](image.png)')).toBe(
    `<p><figure><img src="image.png" alt="fig"><figcaption>fig</figcaption></figure></p>`,
  );
});

it('stringify markdown string into html document', () => {
  expect(lib.stringify('# hello')).toBe(`<!doctype html>
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
