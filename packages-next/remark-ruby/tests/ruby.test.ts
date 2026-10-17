import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { expect, test } from 'vitest';
import { handler as rubyHandler, mdast as ruby } from '../src/ruby.js';

// TODO(#286): every test is skipped until the ruby tokenizer is rewritten as a
// micromark extension. remark-parse 11 ignores the remark-parse 8 tokenizer.

const stringify = (md: string, hardLineBreaks = false): string => {
  let processor = unified().use(remarkParse).use(ruby);
  if (hardLineBreaks) {
    processor = processor.use(remarkBreaks);
  }
  return String(
    processor
      .use([
        [
          remarkRehype,
          { allowDangerousHtml: true, handlers: { ruby: rubyHandler } },
        ],
        [rehypeStringify, { allowDangerousHtml: true }],
      ])
      .processSync(md),
  );
};

test.skip('Simple ruby', () => {
  expect(stringify('{a|b}')).toBe('<p><ruby>a<rt>b</rt></ruby></p>');
});

test.skip('Enables escape in ruby body', () => {
  expect(stringify('{a\\|b|c}')).toBe('<p><ruby>a|b<rt>c</rt></ruby></p>');
});

test.skip('Disables any inline rule in <rt>', () => {
  expect(stringify('{a|*b*}')).toBe('<p><ruby>a<rt>*b*</rt></ruby></p>');
});

test.skip('Nested ruby', () => {
  expect(stringify('{{a|b}|c}')).toBe('<p><ruby>{a<rt>b</rt></ruby>|c}</p>');
});

test.skip('Ruby with newline', () => {
  expect(stringify('{a\nb|c}', true)).toBe('<p>{a<br>\nb|c}</p>');
});

test.skip('Ruby in Markdown link', () => {
  expect(stringify('[{a|b}](c)')).toBe(
    '<p><a href="c"><ruby>a<rt>b</rt></ruby></a></p>',
  );
});

test.skip('Ruby with surrounding text in Markdown link', () => {
  expect(stringify('[x{a|b}y](c)')).toBe(
    '<p><a href="c">x<ruby>a<rt>b</rt></ruby>y</a></p>',
  );
});

test.skip('Ruby in raw HTML anchor', () => {
  expect(stringify('<a href="c">{a|b}</a>')).toBe(
    '<p><a href="c"><ruby>a<rt>b</rt></ruby></a></p>',
  );
});

test.skip('Link in ruby body', () => {
  expect(stringify('{[a](b)|c}')).toBe(
    '<p><ruby><a href="b">a</a><rt>c</rt></ruby></p>',
  );
});
