import * as lib from '../src';
import { ReplaceRule } from '../src/plugins/replace';

function partial(body: string) {
  return lib.stringify(body, { partial: true });
}

// Snippet
//
// it('do something', ()=>{
//   expect(partial(``)).toBe(``)
// })

it.skip('plain section', () => {
  expect(partial(`# {.ok}`)).toBe(`<section class="ok"></section>`);
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
  const result = partial(`
:::foos
# foo
foovar
:::
`);

  expect(result).toBe(
    `<div class="foos"><section id="foo"><h1>foo</h1><p>foovar</p></section></div>`,
  );

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

it('empty replace', () => {
  const rules = [] as ReplaceRule[];
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
  ).toBe(`<p>[icon1][Notice]</p>
<p>[person][Nod nod]</p>`);
});
