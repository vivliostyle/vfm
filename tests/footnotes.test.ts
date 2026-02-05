import { test, expect } from 'vitest';
import { h } from 'hastscript';
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
  expect(received).toContain('<span class="footnote">');
  expect(received).toContain('https://github.com/vivliostyle/vfm');
  expect(received).not.toContain('class="footnotes"');
  expect(received).not.toContain('role="doc-endnotes"');
  expect(received).not.toContain('footnote-back');
  expect(received).not.toContain('footnote-backref');
});

test('endnotesAsFootnotes: inline footnote', () => {
  const md = `Footnotes can also be written inline^[This part is a footnote.].`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: true,
  });
  expect(received).toContain('<span class="footnote">');
  expect(received).toContain('This part is a footnote.');
  expect(received).not.toContain('class="footnotes"');
  expect(received).not.toContain('role="doc-endnotes"');
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
  expect(received).toContain('First footnote content');
  expect(received).toContain('Second footnote content');
  expect(received).not.toContain('class="footnotes"');
  // Each footnote is wrapped in its own span
  const matches = received.match(/<span class="footnote">/g);
  expect(matches).toHaveLength(2);
});

test('endnotesAsFootnotes: custom factory', () => {
  const md = `Reference[^1].

[^1]: Custom footnote`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: (hFn) => (_selector, props, ...children) =>
      hFn('aside', { ...props, class: 'custom-fn' }, ...children),
  });
  expect(received).toContain('<aside class="custom-fn">');
  expect(received).toContain('Custom footnote');
  expect(received).not.toContain('class="footnotes"');
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

test('endnotesAsFootnotes: disabled by default', () => {
  const md = `Reference[^1].

[^1]: Footnote content`;
  const received = stringify(md, { partial: true });
  // Should produce Pandoc format (existing behavior)
  expect(received).toContain('class="footnote-ref"');
  expect(received).toContain('role="doc-endnotes"');
  expect(received).not.toContain('<span class="footnote">');
});

test('endnotesAsFootnotes: no footnotes present', () => {
  const md = `Just plain text without footnotes.`;
  const received = stringify(md, {
    partial: true,
    endnotesAsFootnotes: true,
  });
  expect(received).toContain('Just plain text without footnotes.');
  expect(received).not.toContain('class="footnotes"');
  expect(received).not.toContain('<span class="footnote">');
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
