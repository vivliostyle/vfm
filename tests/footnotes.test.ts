import { stringify } from '../src/index';

it('Footnotes', () => {
  const md = `VFM is developed in the GitHub repository [^1].

[^1]: [VFM](https://github.com/vivliostyle/vfm)`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>VFM is developed in the GitHub repository <sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup>.</p>
<div class="footnotes">
  <hr>
  <ol>
    <li id="fn-1"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref-1" class="footnote-backref">↩</a></li>
  </ol>
</div>
`;
  expect(received).toBe(expected);
});

it('Inline', () => {
  const md = `Footnotes can also be written inline ^[This part is a footnote.].`;
  const received = stringify(md, { partial: true });
  const expected = `
<p>Footnotes can also be written inline <sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup>.</p>
<div class="footnotes">
  <hr>
  <ol>
    <li id="fn-1">This part is a footnote.<a href="#fnref-1" class="footnote-backref">↩</a></li>
  </ol>
</div>
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
  VFM is developed in the GitHub repository <sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup>.
  Issues are managed on GitHub <sup id="fnref-issues"><a href="#fn-issues" class="footnote-ref">Issues</a></sup>.
  Footnotes can also be written inline <sup id="fnref-2"><a href="#fn-2" class="footnote-ref">2</a></sup>.
</p>
<div class="footnotes">
  <hr>
  <ol>
    <li id="fn-1"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref-1" class="footnote-backref">↩</a></li>
    <li id="fn-issues"><a href="https://github.com/vivliostyle/vfm/issues">Issues</a><a href="#fnref-issues" class="footnote-backref">↩</a></li>
    <li id="fn-2">This part is a footnote.<a href="#fnref-2" class="footnote-backref">↩</a></li>
  </ol>
</div>
`;
  expect(received).toBe(expected);
});
