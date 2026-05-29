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

/**
 * The minimal `remark-attr` configuration sectionize needs to be tested
 * against: inline attributes on ATX headings (`# Heading {#id .class key=value}`),
 * with a permissive scope so arbitrary attributes survive sectionization.
 * Only `atxHeading` is relevant here; the other elements VFM enables do not
 * interact with sectionize.
 */
const attrOptions = {
  enableAtxHeaderInline: true,
  scope: 'permissive',
  elements: ['atxHeading'],
} as const;

/**
 * Run a section-only stringify pipeline that mirrors the relevant subset of
 * VFM's pipeline (attr + section + raw + format) without depending on
 * the rest of VFM.
 */
export const stringify = (md: string, formatHtml = true): string => {
  let processor = unified()
    .use(remarkParse, { gfm: true, commonmark: true })
    .use(attr, attrOptions)
    .use(section)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(raw);
  if (formatHtml) {
    processor = processor.use(format);
  }
  return String(processor.use(rehypeStringify).processSync(md));
};
