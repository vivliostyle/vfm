import { test, expect } from 'vitest';
import { stringify } from '../src';
import { ReplaceRule } from '../src/plugins/replace';

test('replace', () => {
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
    stringify(
      `
[icon1][Notice]

[person][Nod nod]`,
      {
        partial: true,
        replace: rules,
        disableFormatHtml: true,
      },
    ),
  )
    .toBe(`<p><div class="balloon"><img src="./img/icon1.png"><span>Notice</span></div></p>
<p><div class="balloon"><img src="./img/person.png"><span>Nod nod</span></div></p>`);
});

test('empty replace', () => {
  const rules = [] as ReplaceRule[];
  expect(
    stringify(
      `
[icon1][Notice]

[person][Nod nod]`,
      {
        partial: true,
        replace: rules,
        disableFormatHtml: true,
      },
    ),
  ).toBe(`<p>[icon1][Notice]</p>
<p>[person][Nod nod]</p>`);
});

test('<pre>', () => {
  const actual = stringify(`<pre>\n*    *    *\n   *    *    *\n</pre>`, {
    partial: true,
    disableFormatHtml: true,
  });
  // In CommonMark parsing, a line break is inserted immediately after `<pre>`
  // In this test, line breaks are intentionally removed according to the behavior of VFM.
  const expected = `<pre>*    *    *
   *    *    *
</pre>`;
  expect(actual).toBe(expected);
});

test('Raw HTML', () => {
  const actual = stringify(
    `<div class="custom">
  <p>Hey</p>
</div>`,
    {
      partial: true,
    },
  );
  const expected = `
<div class="custom">
  <p>Hey</p>
</div>
`;
  expect(actual).toBe(expected);
});

test('Raw HTML with Markdown', () => {
  const actual = stringify(
    `<div class="custom">

# Heading
  
</div>`,
    {
      partial: true,
    },
  );
  const expected = `
<div class="custom">
  <section class="level1">
    <h1 id="heading">Heading</h1>
  </section>
</div>
`;
  expect(actual).toBe(expected);
});

test('User-specified metadata (without Frontmatter)', () => {
  const actual = stringify(
    '# Title',
    {},
    { title: 'My Page', body: [{ name: 'id', value: 'page' }] },
  );
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>My Page</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body id="page">
    <section class="level1">
      <h1 id="title">Title</h1>
    </section>
  </body>
</html>
`;
  expect(actual).toBe(expected);
});
