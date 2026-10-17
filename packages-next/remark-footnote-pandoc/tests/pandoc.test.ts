// @ts-expect-error no type
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import remarkFootnotes from 'remark-footnotes';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import { expect, test } from 'vitest';
import { createPandocFootnotePlugin } from '../src/index.js';

// Test pipeline mirrors VFM's footnote-relevant subset so this package's
// plugin can be exercised in isolation. Output is naturally partial
// (no <head>/<body>), matching the per-package expected strings
// migrated verbatim from vfm/tests/footnotes.test.ts.
const stringify = (md: string): string => {
  const { toHastHandlers, hastTransformer } = createPandocFootnotePlugin();
  return String(
    unified()
      .use([
        [remarkParse, { gfm: true, commonmark: true }],
        [remarkFootnotes, { inlineNotes: true }],
        [
          remarkRehype,
          {
            allowDangerousHtml: true,
            handlers: Object.fromEntries(
              Object.entries(toHastHandlers).filter(([, v]) => v !== undefined),
            ),
          },
        ],
        hastTransformer,
        rehypeFormat,
        rehypeStringify,
      ])
      .processSync(md),
  );
};

test('Footnotes', () => {
  const md = `VFM is developed in the GitHub repository[^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md);
  const expected = `
<p>VFM is developed in the GitHub repository<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
`;
  expect(received).toBe(expected);
});

test('Inline', () => {
  const md = `Footnotes can also be written inline^[This part is a footnote.].`;
  const received = stringify(md);
  const expected = `
<p>Footnotes can also be written inline<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote">This part is a footnote.<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
`;
  expect(received).toBe(expected);
});

test('Multiple', () => {
  const md = `VFM is developed in the GitHub repository[^1].
Issues are managed on GitHub[^Issues].
Footnotes can also be written inline^[This part is a footnote.].

[^1]: [VFM](https://github.com/vivliostyle/vfm)

[^Issues]: [Issues](https://github.com/vivliostyle/vfm/issues)
`;
  const received = stringify(md);
  const expected = `
<p>
  VFM is developed in the GitHub repository<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.
  Issues are managed on GitHub<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.
  Footnotes can also be written inline<a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a>.
</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
    <li id="fn2" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm/issues">Issues</a><a href="#fnref2" class="footnote-back" role="doc-backlink">↩</a></li>
    <li id="fn3" role="doc-endnote">This part is a footnote.<a href="#fnref3" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
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
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote">Aaaaaa<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a><a href="#fnref1-1" class="footnote-back" role="doc-backlink">↩</a></li>
    <li id="fn2" role="doc-endnote">Bbbbbb<a href="#fnref2" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
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

// Assert that each fragment is present and appears in strictly ascending
// order within `received`.  Catches partial fixes that relabel ids
// correctly but leave the physical ordering of <ol>/<aside> reversed.
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
    '<li id="fn1" role="doc-endnote">fn1<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>',
    '<li id="fn2" role="doc-endnote">fn2<a href="#fnref2" class="footnote-back" role="doc-backlink">↩</a></li>',
    '<li id="fn3" role="doc-endnote">fn3<a href="#fnref3" class="footnote-back" role="doc-backlink">↩</a></li>',
  ]);
});
