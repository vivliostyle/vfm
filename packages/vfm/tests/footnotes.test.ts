import { test, expect } from 'vitest';
import { stringify } from '../src/index.js';

test('Footnotes', () => {
  const md = `VFM is developed in the GitHub repository[^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md, { partial: true });
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
  const received = stringify(md, { partial: true });
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
  const received = stringify(md, { partial: true });
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

// gcpm mode tests

test('gcpm: basic', () => {
  const md = `VFM is developed in the GitHub repository[^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md, {
    partial: true,
    footnote: 'gcpm',
  });
  const expected = `
<p>VFM is developed in the GitHub repository<span class="footnote" id="fn-1" role="doc-footnote"><a href="https://github.com/vivliostyle/vfm">VFM</a></span>.</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: inline footnote', () => {
  const md = `Footnotes can also be written inline^[This part is a footnote.].`;
  const received = stringify(md, {
    partial: true,
    footnote: 'gcpm',
  });
  const expected = `
<p>Footnotes can also be written inline<span class="footnote" id="fn-1" role="doc-footnote">This part is a footnote.</span>.</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: multiple footnotes', () => {
  const md = `First reference[^1].
Second reference[^2].

[^1]: First footnote content

[^2]: Second footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: 'gcpm',
  });
  const expected = `
<p>
  First reference<span class="footnote" id="fn-1" role="doc-footnote">First footnote content</span>.
  Second reference<span class="footnote" id="fn-2" role="doc-footnote">Second footnote content</span>.
</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: custom properties', () => {
  const md = `Reference[^1].

[^1]: Footnote with custom props`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'gcpm',
      body: { class: 'my-footnote', 'data-type': 'note' },
    },
  });
  const expected = `
<p>Reference<span id="fn-1" role="doc-footnote" class="my-footnote" data-type="note">Footnote with custom props</span>.</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: custom properties with id override', () => {
  const md = `Reference[^1].

[^1]: Footnote with custom id`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'gcpm',
      body: { id: 'custom-id', class: 'my-footnote' },
    },
  });
  const expected = `
<p>Reference<span id="custom-id" role="doc-footnote" class="my-footnote">Footnote with custom id</span>.</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: via frontmatter', () => {
  const md = `---
vfm:
  footnote: gcpm
---

Text with footnote[^1].

[^1]: Footnote via frontmatter`;
  const received = stringify(md, { partial: true });
  expect(received).toContain(
    '<span class="footnote" id="fn-1" role="doc-footnote">',
  );
  expect(received).not.toContain('class="footnotes"');
});

test('gcpm: custom properties via frontmatter', () => {
  const md = `---
vfm:
  footnote:
    mode: gcpm
    body:
      class: my-footnote
      data-type: note
---

Text with footnote[^1].

[^1]: Footnote via frontmatter props`;
  const received = stringify(md, { partial: true });
  expect(received).toContain(
    '<span id="fn-1" role="doc-footnote" class="my-footnote" data-type="note">',
  );
  expect(received).toContain('Footnote via frontmatter props');
  expect(received).not.toContain('class="footnotes"');
});

test('pandoc: disabled by default', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote">Footnote content<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
`;
  expect(received).toBe(expected);
});

test('gcpm: no footnotes present', () => {
  const md = `Just plain text without footnotes.`;
  const received = stringify(md, {
    partial: true,
    footnote: 'gcpm',
  });
  const expected = `
<p>Just plain text without footnotes.</p>
`;
  expect(received).toBe(expected);
});

// dpub mode tests

test('dpub: basic reference footnote', () => {
  const md = `Text with footnote[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>Text with footnote<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: inline footnote', () => {
  const md = `Text with inline^[Inline content].`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>Text with inline<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Inline content</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: multiple footnotes in same paragraph', () => {
  const md = `First[^1] and second[^2].

[^1]: First note

[^2]: Second note`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>First<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a> and second<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>First note</aside>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>Second note</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: footnotes in different paragraphs', () => {
  const md = `First paragraph[^1].

Second paragraph[^2].

[^1]: First note

[^2]: Second note`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>First paragraph<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<p>Second paragraph<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>First note</aside>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>Second note</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: via frontmatter', () => {
  const md = `---
vfm:
  footnote: dpub
---

Text with footnote[^1].

[^1]: Footnote via frontmatter`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>Text with footnote<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote via frontmatter</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: no footnotes present', () => {
  const md = `Just plain text.`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>Just plain text.</p>
`;
  expect(received).toBe(expected);
});

test('dpub: aside at definition position, not call position', () => {
  const md = `test[^1]

one more line

[^1]: footnote body`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>test<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></p>
<p>one more line</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>footnote body</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: aside placed at definition position outside transparent element', () => {
  const md = `<del>

Text with footnote[^1].

</del>

[^1]: Deleted footnote`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `<del><p>Text with footnote<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p></del>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Deleted footnote</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: aside escapes recursively through nested transparent elements', () => {
  const md = `<del><ins>Text[^1]</ins></del> after.

[^1]: Nested footnote`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p><del><ins>Text<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></ins></del> after.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Nested footnote</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: call props on reference', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: { mode: 'dpub', call: { class: 'my-ref' } },
  });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="my-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: body props on aside', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: { mode: 'dpub', body: { class: 'my-note' } },
  });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="my-note" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: body factory can customize backlink', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'dpub',
      // backlink is typed as DpubBacklink, so it can be customized
      // in a type-safe manner
      body: (hFn, props, [backlink, ...content]) =>
        hFn('aside', props, backlink, ') ', ...content),
    },
  });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>) Footnote content</aside>
`;
  expect(received).toBe(expected);
});

// factory selector class tests

test('gcpm: factory selector class via shorthand', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'gcpm',
      body: (hFn, props, children) => hFn('.foobar', props, ...children),
    },
  });
  const expected = `
<p>Reference<span class="foobar" id="fn-1" role="doc-footnote">Footnote content</span>.</p>
`;
  expect(received).toBe(expected);
});

test('dpub: call factory selector class via shorthand', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'dpub',
      call: (hFn, props, children) => hFn('.foobar', props, ...children),
    },
  });
  const expected = `
<p>Reference<a class="foobar footnote-ref" id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

test('dpub: body factory selector class via shorthand', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'dpub',
      body: (hFn, props, children) => hFn('.foobar', props, ...children),
    },
  });
  const expected = `
<p>Reference<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside class="foobar footnote" id="fn1" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

// duplicate reference tests

test('pandoc: same footnote referenced from multiple locations', () => {
  const md = `Aaa[^a] bbb[^b].

Ccc aaa[^a].

[^a]: Aaaaaa
[^b]: Bbbbbb`;
  const received = stringify(md, {
    partial: true,
    footnote: 'pandoc',
  });
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

test('dpub: same footnote referenced from multiple locations', () => {
  const md = `Aaa[^a] bbb[^b].

Ccc aaa[^a].

[^a]: Aaaaaa
[^b]: Bbbbbb`;
  const received = stringify(md, {
    partial: true,
    footnote: 'dpub',
  });
  const expected = `
<p>Aaa<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a> bbb<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.</p>
<p>Ccc aaa<a id="fnref1-1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>Aaaaaa</aside>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>Bbbbbb</aside>
`;
  expect(received).toBe(expected);
});

// gcpm duplicate reference tests
//
// Each `float: footnote` element is its own footnote with its own
// ::footnote-call and ::footnote-marker, so duplicating the <span> would
// produce multiple footnotes with the same text.  Instead, VFM emits the
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

test('gcpm: same footnote referenced from multiple locations', () => {
  const md = `Aaa[^a] bbb[^b].

Ccc aaa[^a].

[^a]: Aaaaaa
[^b]: Bbbbbb`;
  const received = stringify(md, {
    partial: true,
    footnote: 'gcpm',
  });
  const expected = `
<p>Aaa<span class="footnote" id="fn-a" role="doc-footnote">Aaaaaa</span> bbb<span class="footnote" id="fn-b" role="doc-footnote">Bbbbbb</span>.</p>
<p>Ccc aaa<a href="#fn-a" class="footnote-duplicated-call" role="doc-noteref"></a>.</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: duplicatedCall with Properties customization', () => {
  const md = `Aaa[^a].

Bbb[^a].

[^a]: Aaaaaa`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'gcpm',
      duplicatedCall: { 'data-custom': 'true' },
    },
  });
  const expected = `
<p>Aaa<span class="footnote" id="fn-a" role="doc-footnote">Aaaaaa</span>.</p>
<p>Bbb<a href="#fn-a" class="footnote-duplicated-call" role="doc-noteref" data-custom="true"></a>.</p>
`;
  expect(received).toBe(expected);
});

test('gcpm: duplicatedCall with factory customization', () => {
  const md = `Aaa[^a].

Bbb[^a].

[^a]: Aaaaaa`;
  const received = stringify(md, {
    partial: true,
    footnote: {
      mode: 'gcpm',
      duplicatedCall: (hFn, props) =>
        hFn('a', { ...props, 'data-factory': 'yes' }),
    },
  });
  const expected = `
<p>Aaa<span class="footnote" id="fn-a" role="doc-footnote">Aaaaaa</span>.</p>
<p>Bbb<a href="#fn-a" class="footnote-duplicated-call" role="doc-noteref" data-factory="yes"></a>.</p>
`;
  expect(received).toBe(expected);
});

// string alias tests

test('"pandoc" string behaves like default', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const asDefault = stringify(md, { partial: true });
  const asPandoc = stringify(md, {
    partial: true,
    footnote: 'pandoc',
  });
  expect(asPandoc).toBe(asDefault);
});

test('"gcpm" string behaves like { mode: "gcpm" }', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const asObject = stringify(md, {
    partial: true,
    footnote: { mode: 'gcpm' },
  });
  const asString = stringify(md, {
    partial: true,
    footnote: 'gcpm',
  });
  expect(asString).toBe(asObject);
});

// Regression tests for https://github.com/vivliostyle/vfm/issues/129
// Footnote references placed inside table cells must resolve to the
// matching footnote body in definition order across all three modes.

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
  const positions = fragments.map((f) => {
    const pos = received.indexOf(f);
    expect(pos, `fragment not found: ${f}`).toBeGreaterThanOrEqual(0);
    return pos;
  });
  for (let i = 1; i < positions.length; i++) {
    expect(
      positions[i],
      `fragments out of order at index ${i}: ${fragments[i]}`,
    ).toBeGreaterThan(positions[i - 1]);
  }
};

test('issue #129 pandoc: table footnote calls resolve to matching bodies', () => {
  const received = stringify(issue129Md, {
    partial: true,
    footnote: 'pandoc',
  });
  expectInOrder(received, [
    '<td>bar<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></td>',
    '<td>baz<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a></td>',
    '<td>bee<a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a></td>',
    '<li id="fn1" role="doc-endnote">fn1<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>',
    '<li id="fn2" role="doc-endnote">fn2<a href="#fnref2" class="footnote-back" role="doc-backlink">↩</a></li>',
    '<li id="fn3" role="doc-endnote">fn3<a href="#fnref3" class="footnote-back" role="doc-backlink">↩</a></li>',
  ]);
});

test('issue #129 dpub: table footnote calls resolve to matching bodies', () => {
  const received = stringify(issue129Md, {
    partial: true,
    footnote: 'dpub',
  });
  expectInOrder(received, [
    '<td>bar<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></td>',
    '<td>baz<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a></td>',
    '<td>bee<a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a></td>',
    '<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a>fn1</aside>',
    '<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>fn2</aside>',
    '<aside id="fn3" class="footnote" role="doc-footnote"><a href="#fnref3" class="footnote-back" role="doc-backlink"><sup>3</sup></a>fn3</aside>',
  ]);
});

test('issue #129 gcpm: table footnote calls resolve to matching bodies', () => {
  const received = stringify(issue129Md, {
    partial: true,
    footnote: 'gcpm',
  });
  expectInOrder(received, [
    '<td>bar<span class="footnote" id="fn-fn1" role="doc-footnote">fn1</span></td>',
    '<td>baz<span class="footnote" id="fn-fn2" role="doc-footnote">fn2</span></td>',
    '<td>bee<span class="footnote" id="fn-fn3" role="doc-footnote">fn3</span></td>',
  ]);
});

test('Heading title and section id without inline footnotes text', () => {
  const md = '# Test^[Test]';
  const received = stringify(md);
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <section class="level1">
      <h1 id="test">Test<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a></h1>
    </section>
    <section class="footnotes" role="doc-endnotes">
      <hr>
      <ol>
        <li id="fn1" role="doc-endnote">Test<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
      </ol>
    </section>
  </body>
</html>
`;
  expect(received).toBe(expected);
});
