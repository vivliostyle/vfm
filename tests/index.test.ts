import * as lib from '../src';
import { ReplaceRule } from '../src/plugins/replace';

/**
 * Run VFM stringify in partial mode.
 * @param body Markdown string that becomes `<body>` part.
 * @param hardLineBreaks Add `<br>` at the position of hard line breaks, without needing spaces.
 * @returns HTML string.
 */
function partial(body: string, hardLineBreaks = false) {
  return lib.stringify(body, {
    partial: true,
    hardLineBreaks,
    disableFormatHtml: true,
  });
}

// Snippet
//
// it('do something', ()=>{
//   expect(partial(``)).toBe(``)
// })

it.skip('plain section', () => {
  expect(partial(`# {.ok}`)).toBe(`<section class="ok"></section>`);
});

it('stringify markdown string into html document', () => {
  expect(lib.stringify('# こんにちは', { disableFormatHtml: true }))
    .toBe(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>こんにちは</title>
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
        disableFormatHtml: true,
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
        disableFormatHtml: true,
      },
    ),
  ).toBe(`<p>[icon1][Notice]</p>
<p>[person][Nod nod]</p>`);
});

it('<pre>', () => {
  const actual = lib.stringify(`<pre>\n*    *    *\n   *    *    *\n</pre>`, {
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
