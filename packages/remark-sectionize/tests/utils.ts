// @ts-expect-error no type
import format from 'rehype-format';
import raw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
// @ts-expect-error no type
import attr from 'remark-attr';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import { mdast as section } from '../src/section.js';

export const stringify = (md: string): string => {
  const processor = unified()
    .use(remarkParse, { gfm: true, commonmark: true })
    .use(attr, {
      enableAtxHeaderInline: true,
      scope: 'permissive',
      elements: ['atxHeading'],
    })
    .use(section)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(raw)
    .use(format);
  return String(processor.use(rehypeStringify).processSync(md));
};
