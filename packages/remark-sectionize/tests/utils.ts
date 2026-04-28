import GithubSlugger from 'github-slugger';
import type { Heading } from 'mdast';
import { toString } from 'mdast-util-to-string';
import format from 'rehype-format';
import raw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import attr from 'remark-attr';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';
import { mdast as section } from '../src/section.js';

const slug = () => (tree: Node) => {
  const slugger = new GithubSlugger();
  visit(tree, 'heading', (node: Heading) => {
    const existing = node.data?.hProperties?.id;
    const id =
      typeof existing === 'string' && existing
        ? slugger.slug(existing, true)
        : slugger.slug(toString(node));
    if (!node.data) node.data = {};
    if (!node.data.hProperties) node.data.hProperties = {};
    node.data.hProperties.id = id;
  });
};

/**
 * Mirror of `vfm/src/plugins/attr.ts`. Kept inline so this package's tests do
 * not depend on `@vivliostyle/vfm`.
 */
const attrOptions = {
  enableAtxHeaderInline: true,
  scope: 'permissive',
  elements: [
    'link',
    'atxHeading',
    'strong',
    'emphasis',
    'code',
    'deletion',
    'reference',
    'footnoteCall',
    'autoLink',
    'fencedCode',
  ],
} as const;

/**
 * Run a section-only stringify pipeline that mirrors the relevant subset of
 * VFM's pipeline (attr + slug + section + raw + format) without depending on
 * the rest of VFM.
 */
export const stringify = (md: string, formatHtml = true): string => {
  let processor = unified()
    .use(remarkParse, { gfm: true, commonmark: true })
    .use(attr, attrOptions)
    .use(slug)
    .use(section)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(raw);
  if (formatHtml) {
    processor = processor.use(format);
  }
  return String(processor.use(rehypeStringify).processSync(md));
};
