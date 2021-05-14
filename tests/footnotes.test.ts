import { stringify } from '../src/index';

it('Footnotes', () => {
  const md = `VFM is developed in the GitHub repository [^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>VFM is developed in the GitHub repository <a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
`;
  expect(received).toBe(expected);
});

it('Inline', () => {
  const md = `Footnotes can also be written inline ^[This part is a footnote.].`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>Footnotes can also be written inline <a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote">This part is a footnote.<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
`;
  expect(received).toBe(expected);
});

it('Multiple', () => {
  const md = `VFM is developed in the GitHub repository [^1].
Issues are managed on GitHub [^Issues].
Footnotes can also be written inline ^[This part is a footnote.].

[^1]: [VFM](https://github.com/vivliostyle/vfm)

[^Issues]: [Issues](https://github.com/vivliostyle/vfm/issues)
`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>
  VFM is developed in the GitHub repository <a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.
  Issues are managed on GitHub <a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.
  Footnotes can also be written inline <a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a>.
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
