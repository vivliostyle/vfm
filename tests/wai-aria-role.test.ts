import { stringify } from '../src/index';

const options = {
  partial: true,
  disableFormatHtml: true,
};

it('doc-appendix', () => {
  const md = `# Appendix {.appendix}`;
  const received = stringify(md, options);
  const expected = `<section class="level1" aria-labelledby="appendix"><h1 class="appendix" id="appendix" role="doc-appendix">Appendix</h1></section>`;
  expect(received).toBe(expected);
});

it('doc-chapter', () => {
  const md = `# Example {.example}`;
  const received = stringify(md, options);
  const expected = `<section class="level1" aria-labelledby="example"><h1 class="example" id="example" role="doc-example">Example</h1></section>`;
  expect(received).toBe(expected);
});
