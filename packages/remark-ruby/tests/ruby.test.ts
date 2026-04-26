import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import { expect, test } from 'vitest';
import { handler as rubyHandler, mdast as ruby } from '../src/ruby.js';

const stringify = (md: string, hardLineBreaks = false): string => {
  let processor = unified()
    .use(remarkParse, { gfm: true, commonmark: true })
    .use(ruby);
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
        rehypeStringify,
      ])
      .processSync(md),
  );
};

test('Simple ruby', () => {
  expect(stringify('{a|b}')).toBe('<p><ruby>a<rt>b</rt></ruby></p>');
});

test('Enables escape in ruby body', () => {
  expect(stringify('{a\\|b|c}')).toBe('<p><ruby>a|b<rt>c</rt></ruby></p>');
});

test('Disables any inline rule in <rt>', () => {
  expect(stringify('{a|*b*}')).toBe('<p><ruby>a<rt>*b*</rt></ruby></p>');
});

test('Nested ruby', () => {
  expect(stringify('{{a|b}|c}')).toBe('<p><ruby>{a<rt>b</rt></ruby>|c}</p>');
});

test('Ruby with newline', () => {
  expect(stringify('{a\nb|c}', true)).toBe('<p>{a<br>\nb|c}</p>');
});
