import { test, expect } from 'vitest';
import { stringify } from '../src/index.js';

// Switch-logic tests for VFM's footnote dispatcher. Per-mode HTML output
// behaviour lives in the dedicated packages:
//   @vivliostyle/remark-footnote-pandoc
//   @vivliostyle/remark-footnote-dpub
//   @vivliostyle/remark-footnote-gcpm
// What is exercised here is VFM-specific: default-mode resolution,
// `footnote` string-vs-object normalization, `vfm.footnote` frontmatter
// pickup, and full-pipeline integration (heading, section, document
// wrapping) around the footnote output.

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
