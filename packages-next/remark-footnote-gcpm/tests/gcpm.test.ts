// @ts-expect-error no type
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import remarkFootnotes from 'remark-footnotes';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import { expect, test } from 'vitest';
import {
  createGcpmFootnotePlugin,
  type GcpmFootnoteOptions,
} from '../src/index.js';

// Test pipeline mirrors VFM's footnote-relevant subset so this package's
// plugin can be exercised in isolation. Output is naturally partial
// (no <head>/<body>), matching the per-package expected strings
// migrated verbatim from vfm/tests/footnotes.test.ts.
const stringify = (
  md: string,
  options: GcpmFootnoteOptions = { mode: 'gcpm' },
): string => {
  const { toHastHandlers, hastTransformer } = createGcpmFootnotePlugin(options);
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

test('basic', () => {
  const md = `VFM is developed in the GitHub repository[^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md);
  const expected = `
<p>VFM is developed in the GitHub repository<span class="footnote" id="fn-1" role="doc-footnote"><a href="https://github.com/vivliostyle/vfm">VFM</a></span>.</p>
`;
  expect(received).toBe(expected);
});

test('inline footnote', () => {
  const md = `Footnotes can also be written inline^[This part is a footnote.].`;
  const received = stringify(md);
  const expected = `
<p>Footnotes can also be written inline<span class="footnote" id="fn-1" role="doc-footnote">This part is a footnote.</span>.</p>
`;
  expect(received).toBe(expected);
});

test('multiple footnotes', () => {
  const md = `First reference[^1].
Second reference[^2].

[^1]: First footnote content

[^2]: Second footnote content`;
  const received = stringify(md);
  const expected = `
<p>
  First reference<span class="footnote" id="fn-1" role="doc-footnote">First footnote content</span>.
  Second reference<span class="footnote" id="fn-2" role="doc-footnote">Second footnote content</span>.
</p>
`;
  expect(received).toBe(expected);
});

test('custom properties', () => {
  const md = `Reference[^1].

[^1]: Footnote with custom props`;
  const received = stringify(md, {
    mode: 'gcpm',
    body: { class: 'my-footnote', 'data-type': 'note' },
  });
  const expected = `
<p>Reference<span id="fn-1" role="doc-footnote" class="my-footnote" data-type="note">Footnote with custom props</span>.</p>
`;
  expect(received).toBe(expected);
});

test('custom properties with id override', () => {
  const md = `Reference[^1].

[^1]: Footnote with custom id`;
  const received = stringify(md, {
    mode: 'gcpm',
    body: { id: 'custom-id', class: 'my-footnote' },
  });
  const expected = `
<p>Reference<span id="custom-id" role="doc-footnote" class="my-footnote">Footnote with custom id</span>.</p>
`;
  expect(received).toBe(expected);
});

test('no footnotes present', () => {
  const md = `Just plain text without footnotes.`;
  const received = stringify(md);
  const expected = `
<p>Just plain text without footnotes.</p>
`;
  expect(received).toBe(expected);
});

test('factory selector class via shorthand', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    mode: 'gcpm',
    body: (hFn, props, children) => hFn('.foobar', props, ...children),
  });
  const expected = `
<p>Reference<span class="foobar" id="fn-1" role="doc-footnote">Footnote content</span>.</p>
`;
  expect(received).toBe(expected);
});

// Each `float: footnote` element is its own footnote with its own
// ::footnote-call and ::footnote-marker, so duplicating the <span> would
// produce multiple footnotes with the same text.  Instead, GCPM emits the
// <span class="footnote"> only once and uses
// <a class="footnote-duplicated-call"> for later references.
//
// CSS to show the same number at the duplicated call site:
//
//   .footnote-duplicated-call::before {
//     content: target-counter(attr(href url), footnote);
//   }
//
// Style it to match .footnote::footnote-call.

test('same footnote referenced from multiple locations', () => {
  const md = `Aaa[^a] bbb[^b].

Ccc aaa[^a].

[^a]: Aaaaaa
[^b]: Bbbbbb`;
  const received = stringify(md);
  const expected = `
<p>Aaa<span class="footnote" id="fn-a" role="doc-footnote">Aaaaaa</span> bbb<span class="footnote" id="fn-b" role="doc-footnote">Bbbbbb</span>.</p>
<p>Ccc aaa<a href="#fn-a" class="footnote-duplicated-call" role="doc-noteref"></a>.</p>
`;
  expect(received).toBe(expected);
});

test('duplicatedCall with Properties customization', () => {
  const md = `Aaa[^a].

Bbb[^a].

[^a]: Aaaaaa`;
  const received = stringify(md, {
    mode: 'gcpm',
    duplicatedCall: { 'data-custom': 'true' },
  });
  const expected = `
<p>Aaa<span class="footnote" id="fn-a" role="doc-footnote">Aaaaaa</span>.</p>
<p>Bbb<a href="#fn-a" class="footnote-duplicated-call" role="doc-noteref" data-custom="true"></a>.</p>
`;
  expect(received).toBe(expected);
});

test('duplicatedCall with factory customization', () => {
  const md = `Aaa[^a].

Bbb[^a].

[^a]: Aaaaaa`;
  const received = stringify(md, {
    mode: 'gcpm',
    duplicatedCall: (hFn, props) =>
      hFn('a', { ...props, 'data-factory': 'yes' }),
  });
  const expected = `
<p>Aaa<span class="footnote" id="fn-a" role="doc-footnote">Aaaaaa</span>.</p>
<p>Bbb<a href="#fn-a" class="footnote-duplicated-call" role="doc-noteref" data-factory="yes"></a>.</p>
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
    '<td>bar<span class="footnote" id="fn-fn1" role="doc-footnote">fn1</span></td>',
    '<td>baz<span class="footnote" id="fn-fn2" role="doc-footnote">fn2</span></td>',
    '<td>bee<span class="footnote" id="fn-fn3" role="doc-footnote">fn3</span></td>',
  ]);
});
