import * as lib from '../src';
import {ReplaceRule} from '../src/replace';

function partial(body: string) {
  return lib.stringify(body, {partial: true});
}

it.skip('handle custom attributes', () => {
  // MEMO:
  // https://github.com/sethvincent/remark-bracketed-spans
  // https://github.com/Paperist/remark-crossref/
  // https://github.com/mrzmmr/remark-behead
  expect(
    partial(`
# Introduction {#introduction}
`),
  ).toBe(`<h1 id="introduction">Introduction</h1>`);

  expect(
    partial(`
[text in the span]{.class .other-class key=val another=example}
`),
  ).toBe(`<h1 id="introduction">Introduction</h1>`);
});

it('handle role', () => {
  expect(
    partial(`
:::@tip
# Tips
:::
`),
  ).toBe(`<aside role="doc-tip"><h1 id="tips">Tips</h1></aside>`);

  expect(
    partial(`
:::@appendix
# Appendix
:::
`),
  ).toBe(
    `<section role="doc-appendix"><h1 id="appendix">Appendix</h1></section>`,
  );
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
<h1 id="title">Title</h1>
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
    `<div class="appendix"><p>:::::nested</p><h1 id="title">Title</h1><p>:::::</p></div>`,
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
  ).toBe(
    `<div class="appendix"><h1 id="appendix">Appendix</h1><p>test</p></div>`,
  );

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
    `<div><h1 id="plain-block">Plain block</h1></div>
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
    `<div class="appendix"><p>A</p><div class="nested"><h1 id="title">Title</h1></div></div>`,
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
  expect(lib.stringify('# こんにちは', {title: 'Custom'})).toBe(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>Custom</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<h1 id="こんにちは">こんにちは</h1>
</body>
</html>
`);
});

it('code', () => {
  expect(
    partial(`
\`\`\`javascript
function() {
  console.log("Hello")
}
\`\`\`
`),
  ).toBe(`<pre><code class="language-javascript">function() {
  console.log("Hello")
}
</code></pre>`);
});

it('code with title', () => {
  expect(
    partial(`
\`\`\`javascript:app.js
function() {
  console.log("Hello")
}
\`\`\`

\`\`\`javascript title=app.js highlight-line="2"
function() {
  console.log("Hello2")
}
\`\`\`

\`\`\`javascript:app.js highlight-line="2"
function() {
  console.log("Hello2")
}
\`\`\`
`),
  )
    .toBe(`<figure class="language-javascript"><figcaption>app.js</figcaption><pre><code class="language-javascript">function() {
  console.log("Hello")
}
</code></pre></figure>
<figure class="language-javascript"><figcaption>app.js</figcaption><pre><code class="language-javascript">function() {
  console.log("Hello2")
}
</code></pre></figure>
<figure class="language-javascript"><figcaption>app.js</figcaption><pre><code class="language-javascript">function() {
  console.log("Hello2")
}
</code></pre></figure>`);
});

it('replace', () => {
  const rules = [
    {
      test: /\[(.+?)\]\[(.+?)\]/,
      match: ([, a, b], h) => {
        return h(
          'div',
          {class: 'balloon'},
          h('img', {src: `./img/${a}.png`}),
          h('span', b),
        );
      },
    },
  ] as ReplaceRule[];
  expect(
    lib.stringify(
      `
[icon1][Notice]

[person][Nod nod]`,
      {
        partial: true,
        replace: rules,
      },
    ),
  )
    .toBe(`<p><div class="balloon"><img src="./img/icon1.png"><span>Notice</span></div></p>
<p><div class="balloon"><img src="./img/person.png"><span>Nod nod</span></div></p>`);
});
