import format from 'rehype-format';
import raw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { mdast as section } from '../src/section.js';

// TODO(#288): heading attributes (`{#id .class hidden}`) came from remark-attr,
// which remark-parse 11 ignores. Re-add the VFM attribute extension here once
// it exists.
export const stringify = (md: string): string => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(section)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(raw)
    .use(format);
  return String(processor.use(rehypeStringify).processSync(md));
};
