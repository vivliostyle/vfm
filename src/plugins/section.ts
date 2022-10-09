/**
 * derived from `remark-sectionize`.
 * original: 2019 Jake Low
 * modified: 2020 Yasuaki Uechi, 2021 and later is Akabeko
 * @license MIT
 * @see https://github.com/jake-low/remark-sectionize
 */

import { Parent } from 'mdast';
import findAfter from 'unist-util-find-after';
import visit from 'unist-util-visit-parents';

/** Maximum depth of hierarchy to process headings. */
const MAX_HEADING_DEPTH = 6;

/**
 * Wrap the header in sections.
 * - Do not sectionize if parent is `blockquote`.
 * - Set the `levelN` class in the section to match the heading depth.
 * @param node Node of Markdown AST.
 * @param ancestors Parents.
 * @todo handle `@subtitle` properly.
 */
const sectionize = (node: any, ancestors: Parent[]) => {
  const parent = ancestors[ancestors.length - 1];
  if (parent.type === 'blockquote') {
    return;
  }

  const start = node;
  const depth = start.depth;

  const isEnd = (node: any) =>
    (node.type === 'heading' && node.depth <= depth) || node.type === 'export';
  const end = findAfter(parent, start, isEnd);

  const startIndex = parent.children.indexOf(start);
  const endIndex = parent.children.indexOf(end);

  const between = parent.children.slice(
    startIndex,
    endIndex > 0 ? endIndex : undefined,
  );

  const hProperties = { class: [`level${depth}`] };

  // {hidden} specifier
  if (Object.keys(node.data.hProperties).includes('hidden')) {
    node.data.hProperties.hidden = 'hidden';
  }

  const isDuplicated = parent.type === 'section';
  if (isDuplicated) {
    if (parent.data?.hProperties) {
      parent.data.hProperties = {
        ...(parent.data.hProperties as any),
        ...hProperties,
      };
    }
    return;
  }

  const type = 'section';
  const section = {
    type,
    data: {
      hName: type,
      hProperties,
    },
    depth: depth,
    children: between,
  } as any;

  parent.children.splice(startIndex, section.children.length, section);
};

/**
 * Process Markdown AST.
 * @returns Transformer.
 */
export const mdast = () => (tree: any) => {
  for (let depth = MAX_HEADING_DEPTH; depth > 0; depth--) {
    visit(
      tree,
      (node: any) => {
        return node.type === 'heading' && node.depth === depth;
      },
      sectionize as any,
    );
  }
};
