import type * as mdast from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { inspectNoColor } from 'unist-util-inspect';
import { expect, test } from 'vitest';
import { mdast as footnoteInline } from '../src/index.js';

/**
 * Parse Markdown with remark-gfm and the inline footnote plugin.
 * @param md - Markdown source.
 * @returns Root.
 */
const parse = (md: string): mdast.Root =>
  unified().use(remarkParse).use(remarkGfm).use(footnoteInline).parse(md);

/**
 * Dump the mdast of `md` without positions.
 * @param md - Markdown source.
 * @returns `unist-util-inspect` dump.
 */
const dump = (md: string): string =>
  inspectNoColor(parse(md)).replace(/ \(.+?\)$/gm, '');

test('inline footnote', () => {
  expect(dump('Text with inline^[Inline content].')).toBe(
    [
      'root[1]',
      '└─0 paragraph[3]',
      '    ├─0 text "Text with inline"',
      '    ├─1 footnote[1]',
      '    │   └─0 text "Inline content"',
      '    └─2 text "."',
    ].join('\n'),
  );
});

test('inline syntax inside the note', () => {
  expect(dump('a^[see *b* and `c`]')).toBe(
    [
      'root[1]',
      '└─0 paragraph[2]',
      '    ├─0 text "a"',
      '    └─1 footnote[4]',
      '        ├─0 text "see "',
      '        ├─1 emphasis[1]',
      '        │   └─0 text "b"',
      '        ├─2 text " and "',
      '        └─3 inlineCode "c"',
    ].join('\n'),
  );
});

test('a link inside the note closes before the note', () => {
  expect(dump('a^[see [b](c) d]')).toBe(
    [
      'root[1]',
      '└─0 paragraph[2]',
      '    ├─0 text "a"',
      '    └─1 footnote[3]',
      '        ├─0 text "see "',
      '        ├─1 link[1]',
      '        │   │ title: null',
      '        │   │ url: "c"',
      '        │   └─0 text "b"',
      '        └─2 text " d"',
    ].join('\n'),
  );
});

test('brackets that are not a link stay text inside the note', () => {
  expect(dump('a^[see [b] c]')).toBe(
    [
      'root[1]',
      '└─0 paragraph[2]',
      '    ├─0 text "a"',
      '    └─1 footnote[1]',
      '        └─0 text "see [b] c"',
    ].join('\n'),
  );
});

test('a note inside a link', () => {
  expect(dump('[a^[b]](c)')).toBe(
    [
      'root[1]',
      '└─0 paragraph[1]',
      '    └─0 link[2]',
      '        │ title: null',
      '        │ url: "c"',
      '        ├─0 text "a"',
      '        └─1 footnote[1]',
      '            └─0 text "b"',
    ].join('\n'),
  );
});

test('coexists with GFM footnote references', () => {
  expect(dump('a[^1] b^[c]\n\n[^1]: d')).toBe(
    [
      'root[2]',
      '├─0 paragraph[4]',
      '│   ├─0 text "a"',
      '│   ├─1 footnoteReference',
      '│   │     identifier: "1"',
      '│   │     label: "1"',
      '│   ├─2 text " b"',
      '│   └─3 footnote[1]',
      '│       └─0 text "c"',
      '└─1 footnoteDefinition[1]',
      '    │ identifier: "1"',
      '    │ label: "1"',
      '    └─0 paragraph[1]',
      '        └─0 text "d"',
    ].join('\n'),
  );
});

test('spans lines inside a paragraph', () => {
  expect(dump('a^[b\nc] d')).toBe(
    [
      'root[1]',
      '└─0 paragraph[3]',
      '    ├─0 text "a"',
      '    ├─1 footnote[1]',
      '    │   └─0 text "b\\nc"',
      '    └─2 text " d"',
    ].join('\n'),
  );
});

test('an unclosed note, an empty note and a bare caret stay text', () => {
  expect(dump('a^[b')).toBe(
    ['root[1]', '└─0 paragraph[1]', '    └─0 text "a^[b"'].join('\n'),
  );
  expect(dump('a^[]b')).toBe(
    ['root[1]', '└─0 paragraph[1]', '    └─0 text "a^[]b"'].join('\n'),
  );
  expect(dump('x^2 and [y]')).toBe(
    ['root[1]', '└─0 paragraph[1]', '    └─0 text "x^2 and [y]"'].join('\n'),
  );
});

test('does not cross a blank line', () => {
  expect(dump('a^[b\n\nc]')).toBe(
    [
      'root[2]',
      '├─0 paragraph[1]',
      '│   └─0 text "a^[b"',
      '└─1 paragraph[1]',
      '    └─0 text "c]"',
    ].join('\n'),
  );
});
