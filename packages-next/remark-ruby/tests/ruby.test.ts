import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { inspectNoColor } from 'unist-util-inspect';
import { expect, test } from 'vitest';
import { handler as rubyHandler, mdast as ruby } from '../src/ruby.js';

/**
 * Render Markdown with the ruby plugin and handler to HTML.
 * @param md - Markdown source.
 * @param options - `hardLineBreaks` adds remark-breaks, `gfm` adds remark-gfm.
 * @returns HTML.
 */
const stringify = (
  md: string,
  { hardLineBreaks = false, gfm = false } = {},
): string => {
  let processor = unified().use(remarkParse).use(ruby);
  if (gfm) {
    processor = processor.use(remarkGfm);
  }
  if (hardLineBreaks) {
    processor = processor.use(remarkBreaks);
  }
  return String(
    processor
      .use([
        [
          remarkRehype,
          { allowDangerousHtml: true, handlers: { ruby: rubyHandler } },
        ],
        [rehypeStringify, { allowDangerousHtml: true }],
      ])
      .processSync(md),
  );
};

/**
 * Parse Markdown with the ruby plugin and dump the mdast without positions.
 * @param md - Markdown source.
 * @returns `unist-util-inspect` dump.
 */
const parse = (md: string): string =>
  inspectNoColor(unified().use(remarkParse).use(ruby).parse(md)).replace(
    / \(.+?\)$/gm,
    '',
  );

test('Simple ruby', () => {
  expect(stringify('{a|b}')).toBe('<p><ruby>a<rt>b</rt></ruby></p>');
});

test('MDAST node', () => {
  expect(parse('x{a|b}y')).toBe(
    [
      'root[1]',
      '└─0 paragraph[3]',
      '    ├─0 text "x"',
      '    ├─1 ruby[1]',
      '    │   │ rubyText: "b"',
      '    │   └─0 text "a"',
      '    └─2 text "y"',
    ].join('\n'),
  );
});

test('Enables escape in ruby body', () => {
  expect(stringify('{a\\|b|c}')).toBe('<p><ruby>a|b<rt>c</rt></ruby></p>');
});

test('Disables any inline rule in <rt>', () => {
  expect(stringify('{a|*b*}')).toBe('<p><ruby>a<rt>*b*</rt></ruby></p>');
});

test('Inline rules in ruby body', () => {
  expect(stringify('{*a*|b}')).toBe('<p><ruby><em>a</em><rt>b</rt></ruby></p>');
});

// Braces pair from the inside out, like brackets in CommonMark, so a ruby can
// be the base of another ruby. The remark-parse 8 tokenizer paired the
// outermost `{` first and produced `<ruby>{a<rt>b</rt></ruby>|c}`.
test('Nested ruby', () => {
  expect(stringify('{{a|b}|c}')).toBe(
    '<p><ruby><ruby>a<rt>b</rt></ruby><rt>c</rt></ruby></p>',
  );
});

test('Ruby with newline', () => {
  expect(stringify('{a\nb|c}', { hardLineBreaks: true })).toBe(
    '<p>{a<br>\nb|c}</p>',
  );
});

test('Ruby in Markdown link', () => {
  expect(stringify('[{a|b}](c)')).toBe(
    '<p><a href="c"><ruby>a<rt>b</rt></ruby></a></p>',
  );
});

test('Ruby with surrounding text in Markdown link', () => {
  expect(stringify('[x{a|b}y](c)')).toBe(
    '<p><a href="c">x<ruby>a<rt>b</rt></ruby>y</a></p>',
  );
});

test('Ruby in raw HTML anchor', () => {
  expect(stringify('<a href="c">{a|b}</a>')).toBe(
    '<p><a href="c"><ruby>a<rt>b</rt></ruby></a></p>',
  );
});

test('Link in ruby body', () => {
  expect(stringify('{[a](b)|c}')).toBe(
    '<p><ruby><a href="b">a</a><rt>c</rt></ruby></p>',
  );
});

test('Multiple rubies in one paragraph', () => {
  expect(stringify('{a|b} and {c|d}')).toBe(
    '<p><ruby>a<rt>b</rt></ruby> and <ruby>c<rt>d</rt></ruby></p>',
  );
});

test('Braces without a separator stay text', () => {
  expect(stringify('{a} and {b}c')).toBe('<p>{a} and {b}c</p>');
});

test('Empty base or empty ruby text stay text', () => {
  expect(stringify('{|b}')).toBe('<p>{|b}</p>');
  expect(stringify('{a|}')).toBe('<p>{a|}</p>');
});

test('Separator without a closing brace on the line stays text', () => {
  expect(stringify('{a|b\nc}')).toBe('<p>{a|b\nc}</p>');
});

test('Ruby text runs to the first closing brace', () => {
  expect(stringify('{a|b}c}')).toBe('<p><ruby>a<rt>b</rt></ruby>c}</p>');
});

// GFM tables split cells at unescaped `|` before inline syntax runs, and an
// escaped `\|` is base text to the ruby syntax. A ruby therefore cannot be
// written inside a table cell (#44); the cell keeps the text.
test('Ruby inside a GFM table cell is not supported (#44)', () => {
  const md = ['| x |', '| - |', '| {a\\|b} |'].join('\n');
  expect(stringify(md, { gfm: true })).toBe(
    [
      '<table>',
      '<thead>',
      '<tr>',
      '<th>x</th>',
      '</tr>',
      '</thead>',
      '<tbody>',
      '<tr>',
      '<td>{a|b}</td>',
      '</tr>',
      '</tbody>',
      '</table>',
    ].join('\n'),
  );
});
