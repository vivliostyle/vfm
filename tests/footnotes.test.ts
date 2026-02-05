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

// endnotesAsFootnotes tests

test('endnotesAsFootnotes: basic', () => {
  const md = `VFM is developed in the GitHub repository[^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: true,
  });
  const expected = `
<p>VFM is developed in the GitHub repository<span class="footnote"><a href="https://github.com/vivliostyle/vfm">VFM</a></span>.</p>
`;
  expect(received).toBe(expected);
});

test('endnotesAsFootnotes: inline footnote', () => {
  const md = `Footnotes can also be written inline^[This part is a footnote.].`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: true,
  });
  const expected = `
<p>Footnotes can also be written inline<span class="footnote">This part is a footnote.</span>.</p>
`;
  expect(received).toBe(expected);
});

test('endnotesAsFootnotes: multiple footnotes', () => {
  const md = `First reference[^1].
Second reference[^2].

[^1]: First footnote content

[^2]: Second footnote content`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: true,
  });
  const expected = `
<p>
  First reference<span class="footnote">First footnote content</span>.
  Second reference<span class="footnote">Second footnote content</span>.
</p>
`;
  expect(received).toBe(expected);
});

test('endnotesAsFootnotes: custom properties', () => {
  const md = `Reference[^1].

[^1]: Footnote with custom props`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: { class: 'my-footnote', 'data-type': 'note' },
  });
  const expected = `
<p>Reference<span class="my-footnote" data-type="note">Footnote with custom props</span>.</p>
`;
  expect(received).toBe(expected);
});

test('endnotesAsFootnotes: custom factory', () => {
  const md = `Reference[^1].

[^1]: Custom footnote`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: (hFn, children) =>
      hFn('aside', { class: 'custom-fn' }, ...children),
  });
  const expected = `
<p>Reference
  <aside class="custom-fn">Custom footnote</aside>.
</p>
`;
  expect(received).toBe(expected);
});

test('endnotesAsFootnotes: via frontmatter', () => {
  const md = `---
vfm:
  endnotesAsFootnotes: true
---

Text with footnote[^1].

[^1]: Footnote via frontmatter`;
  const received = stringify(md, { partial: true });
  expect(received).toContain('<span class="footnote">');
  expect(received).not.toContain('class="footnotes"');
});

test('endnotesAsFootnotes: custom properties via frontmatter', () => {
  const md = `---
vfm:
  endnotesAsFootnotes:
    class: my-footnote
    data-type: note
---

Text with footnote[^1].

[^1]: Footnote via frontmatter props`;
  const received = stringify(md, { partial: true });
  expect(received).toContain('<span class="my-footnote" data-type="note">');
  expect(received).toContain('Footnote via frontmatter props');
  expect(received).not.toContain('class="footnotes"');
});

test('endnotesAsFootnotes: disabled by default', () => {
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

test('endnotesAsFootnotes: no footnotes present', () => {
  const md = `Just plain text without footnotes.`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: true,
  });
  const expected = `
<p>Just plain text without footnotes.</p>
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
