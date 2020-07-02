import * as lib from '../src';
import { ReplaceRule } from '../src/plugins/replace';

function partial(body: string) {
  return lib.stringify(body, { partial: true });
}

it('code', () => {
  expect(
    partial(`
\`\`\`js
function() {"Hello"}
\`\`\``),
  ).toBe(
    `<pre class="language-js"><code class="language-js"><span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token string">"Hello"</span><span class="token punctuation">}</span></code></pre>`,
  );
});

it('handle custom attributes', () => {
  // MEMO:
  // https://github.com/sethvincent/remark-bracketed-spans
  // https://github.com/Paperist/remark-crossref/
  // https://github.com/mrzmmr/remark-behead
  expect(
    partial(`
# Introduction {#introduction}
`),
  ).toBe(`<section id="introduction"><h1>Introduction</h1></section>`);

  expect(partial(`# Hello {hidden}`)).toBe(
    `<section id="hello"><h1 style="display: none;">Hello</h1></section>`,
  );
});

it('handle role', () => {
  expect(
    partial(`
:::@tip
# Tips
:::
`),
  ).toBe(
    `<aside role="doc-tip"><section id="tips"><h1>Tips</h1></section></aside>`,
  );

  expect(
    partial(`
:::@appendix
# Appendix
:::
`),
  ).toBe(
    `<section role="doc-appendix" id="appendix"><h1>Appendix</h1></section>`,
  );

  expect(
    partial(`
# Table of Contents {@toc}

- [Intro](intro.md)
`),
  )
    .toBe(`<nav id="table-of-contents" role="doc-toc"><h1>Table of Contents</h1><ul>
<li><a href="intro.md">Intro</a></li>
</ul></nav>`);
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
:::::nested<br>
# Title<br>
:::::<br>
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
    `<div class="appendix"><p>:::::nested<br>
# Title<br>
:::::</p></div>`,
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
    `<div class="appendix"><section id="appendix"><h1>Appendix</h1><p>test</p></section></div>`,
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
    `<div><section id="plain-block"><h1>Plain block</h1></section></div>
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
    `<div class="appendix"><p>A</p><div class="nested"><section id="title"><h1>Title</h1></section></div></div>`,
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
  expect(partial('$$sum$$')).toBe(
    `<p><span class="math math-inline"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.43056em;vertical-align:0em;"></span><span class="mord mathdefault">s</span><span class="mord mathdefault">u</span><span class="mord mathdefault">m</span></span></span></span></span></p>`,
  );
});

it('ruby', () => {
  expect(partial('{A|B}')).toBe(`<p><ruby>A<rt>B</rt></ruby></p>`);
});

it('convert img to figure', () => {
  expect(partial('![fig](image.png)')).toBe(
    `<p><figure><img src="image.png" alt="fig"><figcaption>fig</figcaption></figure></p>`,
  );
});

it('stringify markdown string into html document', () => {
  expect(lib.stringify('# こんにちは', { title: 'Custom' }))
    .toBe(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Custom</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<section id="こんにちは"><h1>こんにちは</h1></section>
</body>
</html>
`);
});

it('code', () => {
  expect(
    partial(`
\`\`\`javascript
Hello
\`\`\`
`),
  ).toBe(
    `<pre class="language-javascript"><code class="language-javascript"><span class="token maybe-class-name">Hello</span></code></pre>`,
  );
});

it('code with title', () => {
  expect(
    partial(`
\`\`\`javascript:app.js
Hello
\`\`\`

\`\`\`javascript title=app.js highlight-line="2"
Hello
\`\`\`

\`\`\`javascript:app.js highlight-line="2"
Hello
\`\`\`
`),
  )
    .toBe(`<figure class="language-javascript"><figcaption>app.js</figcaption><pre class="language-javascript"><code class="language-javascript"><span class="token maybe-class-name">Hello</span></code></pre></figure>
<figure class="language-javascript"><figcaption>app.js</figcaption><pre class="language-javascript"><code class="language-javascript"><span class="token maybe-class-name">Hello</span></code></pre></figure>
<figure class="language-javascript"><figcaption>app.js</figcaption><pre class="language-javascript"><code class="language-javascript"><span class="token maybe-class-name">Hello</span></code></pre></figure>`);
});

it('replace', () => {
  const rules = [
    {
      test: /\[(.+?)\]\[(.+?)\]/,
      match: ([, a, b], h) => {
        return h(
          'div',
          { class: 'balloon' },
          h('img', { src: `./img/${a}.png` }),
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
