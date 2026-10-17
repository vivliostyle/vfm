// @ts-expect-error no type
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkFootnotes from 'remark-footnotes';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import { expect, test } from 'vitest';
import {
  createDpubFootnotePlugin,
  type DpubFootnoteOptions,
} from '../src/index.js';

// Test pipeline mirrors VFM's footnote-relevant subset so this package's
// plugin can be exercised in isolation. Output is naturally partial
// (no <head>/<body>), matching the per-package expected strings
// migrated verbatim from vfm/tests/footnotes.test.ts.
const stringify = (
  md: string,
  options: DpubFootnoteOptions = { mode: 'dpub' },
): string => {
  const { toHastHandlers, hastTransformer } = createDpubFootnotePlugin(options);
  return String(
    unified()
      .use([
        [remarkParse, { gfm: true, commonmark: true }],
        [remarkFootnotes, { inlineNotes: true }],
        [remarkRehype, { allowDangerousHtml: true, handlers: toHastHandlers }],
        rehypeRaw,
        hastTransformer,
        rehypeFormat,
        rehypeStringify,
      ])
      .processSync(md),
  );
};

test('basic reference footnote', () => {
  const md = `Text with footnote[^1].

[^1]: Footnote content`;
  const received = stringify(md);
  const expected = `
<p>Text with footnote<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('inline footnote', () => {
  const md = `Text with inline^[Inline content].`;
  const received = stringify(md);
  const expected = `
<p>Text with inline<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Inline content</aside>
`;
  expect(received).toBe(expected);
});

test('multiple footnotes in same paragraph', () => {
  const md = `First[^1] and second[^2].

[^1]: First note

[^2]: Second note`;
  const received = stringify(md);
  const expected = `
<p>First<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a> and second<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>First note</aside>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>Second note</aside>
`;
  expect(received).toBe(expected);
});

test('footnotes in different paragraphs', () => {
  const md = `First paragraph[^1].

Second paragraph[^2].

[^1]: First note

[^2]: Second note`;
  const received = stringify(md);
  const expected = `
<p>First paragraph<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<p>Second paragraph<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>First note</aside>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>Second note</aside>
`;
  expect(received).toBe(expected);
});

test('no footnotes present', () => {
  const md = `Just plain text.`;
  const received = stringify(md);
  const expected = `
<p>Just plain text.</p>
`;
  expect(received).toBe(expected);
});

test('aside at definition position, not call position', () => {
  const md = `test[^1]

one more line

[^1]: footnote body`;
  const received = stringify(md);
  const expected = `
<p>test<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></p>
<p>one more line</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>footnote body</aside>
`;
  expect(received).toBe(expected);
});

test('aside placed at definition position outside transparent element', () => {
  const md = `<del>

Text with footnote[^1].

</del>

[^1]: Deleted footnote`;
  const received = stringify(md);
  const expected = `<del><p>Text with footnote<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p></del>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Deleted footnote</aside>
`;
  expect(received).toBe(expected);
});

test('aside escapes recursively through nested transparent elements', () => {
  const md = `<del><ins>Text[^1]</ins></del> after.

[^1]: Nested footnote`;
  const received = stringify(md);
  const expected = `
<p><del><ins>Text<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></ins></del> after.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Nested footnote</aside>
`;
  expect(received).toBe(expected);
});

test('call props on reference', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, { mode: 'dpub', call: { class: 'my-ref' } });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="my-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('body props on aside', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, { mode: 'dpub', body: { class: 'my-note' } });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="my-note" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('body factory can customize backlink', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    mode: 'dpub',
    // backlink is typed as DpubBacklink, so it can be customized
    // in a type-safe manner
    body: (hFn, props, [backlink, ...content]) =>
      hFn('aside', props, backlink, ') ', ...content),
  });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>) Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('call factory selector class via shorthand', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    mode: 'dpub',
    call: (hFn, props, children) => hFn('.foobar', props, ...children),
  });
  const expected = `
<p>Reference<a class="foobar footnote-ref" id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('body factory selector class via shorthand', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    mode: 'dpub',
    body: (hFn, props, children) => hFn('.foobar', props, ...children),
  });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside class="foobar footnote" id="fn1" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('same footnote referenced from multiple locations', () => {
  const md = `Aaa[^a] bbb[^b].

Ccc aaa[^a].

[^a]: Aaaaaa
[^b]: Bbbbbb`;
  const received = stringify(md);
  const expected = `
<p>Aaa<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a> bbb<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.</p>
<p>Ccc aaa<a id="fnref1-1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Aaaaaa</aside>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>Bbbbbb</aside>
`;
  expect(received).toBe(expected);
});

// Regression test for https://github.com/vivliostyle/vfm/issues/129
// Footnote references placed inside table cells must resolve to the
// matching footnote body in definition order.

const issue129Md = `| Label     | Col |
|-----------|-----|
| bar[^fn1] | x   |
| baz[^fn2] | x   |
| bee[^fn3] | x   |

[^fn1]: fn1
[^fn2]: fn2
[^fn3]: fn3
`;

const expectInOrder = (received: string, fragments: string[]) => {
  fragments
    .map((fragment) => {
      const pos = received.indexOf(fragment);
      expect(pos, `fragment not found: ${fragment}`).toBeGreaterThanOrEqual(0);
      return { fragment, pos };
    })
    .flatMap((curr, i, arr) => {
      const prev = arr[i - 1];
      return prev === undefined ? [] : [{ prev, curr }];
    })
    .forEach(({ prev, curr }, i) => {
      expect(
        curr.pos,
        `fragments out of order at index ${i + 1}: ${curr.fragment}`,
      ).toBeGreaterThan(prev.pos);
    });
};

test('issue #129: table footnote calls resolve to matching bodies', () => {
  const received = stringify(issue129Md);
  expectInOrder(received, [
    '<td>bar<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></td>',
    '<td>baz<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a></td>',
    '<td>bee<a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a></td>',
    '<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>fn1</aside>',
    '<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>fn2</aside>',
    '<aside id="fn3" class="footnote" role="doc-footnote"><a href="#fnref3" class="footnote-back" role="doc-backlink"><sup>3</sup></a>fn3</aside>',
  ]);
});
