import { test, expect } from 'vitest';
import { stringify } from '../src/index';

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
<p>VFM is developed in the GitHub repository<span class="footnote" id="fn-1"><a href="https://github.com/vivliostyle/vfm">VFM</a></span>.</p>
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
<p>Footnotes can also be written inline<span class="footnote" id="fn-1">This part is a footnote.</span>.</p>
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
  First reference<span class="footnote" id="fn-1">First footnote content</span>.
  Second reference<span class="footnote" id="fn-2">Second footnote content</span>.
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
<p>Reference<span id="fn-1" class="my-footnote" data-type="note">Footnote with custom props</span>.</p>
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
<p>Reference<span id="custom-id" class="my-footnote">Footnote with custom id</span>.</p>
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
  expect(received).toContain('<span class="footnote" id="fn-1">');
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
    '<span id="fn-1" class="my-footnote" data-type="note">',
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
<p>Text with footnote<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
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
<p>Text with inline<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Inline content</aside>
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
<p>First<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a> and second<a id="fnref2" href="#fn2" role="doc-noteref"><sup>2</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>First note</aside>
<aside id="fn2" role="doc-footnote"><a href="#fnref2" role="doc-backlink"><sup>2</sup></a>Second note</aside>
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
<p>First paragraph<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<p>Second paragraph<a id="fnref2" href="#fn2" role="doc-noteref"><sup>2</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>First note</aside>
<aside id="fn2" role="doc-footnote"><a href="#fnref2" role="doc-backlink"><sup>2</sup></a>Second note</aside>
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
<p>Text with footnote<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Footnote via frontmatter</aside>
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
<p>test<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a></p>
<p>one more line</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>footnote body</aside>
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
  const expected = `<del><p>Text with footnote<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p></del>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Deleted footnote</aside>
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
<p><del><ins>Text<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a></ins></del> after.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Nested footnote</aside>
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
<p>Reference<a id="fnref1" href="#fn1" role="doc-noteref" class="my-ref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
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
<p>Reference<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote" class="my-note"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
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
<p>Reference<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>) Footnote content</aside>
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
<p>Reference<span class="foobar" id="fn-1">Footnote content</span>.</p>
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
<p>Reference<a class="foobar" id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
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
<p>Reference<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside class="foobar" id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Footnote content</aside>
`;
  expect(received).toBe(expected);
});

// duplicate reference tests

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
<p>Aaa<a id="fnref1" href="#fn1" role="doc-noteref"><sup>1</sup></a> bbb<a id="fnref2" href="#fn2" role="doc-noteref"><sup>2</sup></a>.</p>
<p>Ccc aaa<a id="fnref1-1" href="#fn1" role="doc-noteref"><sup>1</sup></a>.</p>
<aside id="fn1" role="doc-footnote"><a href="#fnref1" role="doc-backlink"><sup>1</sup></a>Aaaaaa</aside>
<aside id="fn2" role="doc-footnote"><a href="#fnref2" role="doc-backlink"><sup>2</sup></a>Bbbbbb</aside>
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
