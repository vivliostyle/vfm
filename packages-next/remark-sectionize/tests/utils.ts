import format from 'rehype-format';
import raw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { mdast as attribute } from '@vivliostyle/remark-attribute-next';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { mdast as section } from '../src/section.js';

/**
 * Render Markdown through remark-gfm, the VFM attribute plugin (for
 * `{#id .class hidden}` on headings), sectionize, remark-rehype, rehype-raw
 * and rehype-format.
 * @param md - Markdown source.
 * @returns Formatted HTML.
 */
export const stringify = (md: string): string => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(attribute, { scope: 'permissive' })
    .use(section)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(raw)
    .use(format);
  return String(processor.use(rehypeStringify).processSync(md));
};
