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
 * @param node Node of Markdown AST.
 * @param ancestors Parents.
 * @todo handle `@subtitle` properly.
 */
function sectionize(node: any, ancestors: Parent[]) {
  const start = node;
  const depth = start.depth;
  const parent = ancestors[ancestors.length - 1];

  const isEnd = (node: any) =>
    (node.type === 'heading' && node.depth <= depth) || node.type === 'export';
  const end = findAfter(parent, start, isEnd);

  const startIndex = parent.children.indexOf(start);
  const endIndex = parent.children.indexOf(end);

  const between = parent.children.slice(
    startIndex,
    endIndex > 0 ? endIndex : undefined,
  );

  const type = 'section';

  const hProperties = node.data?.hProperties;
  if (hProperties) {
    node.data.hProperties = {};

    const props = Object.keys(hProperties);

    // {hidden} specifier
    if (props.includes('hidden')) {
      node.data.hProperties.style = 'display: none;';
    }
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

  // output section levels like Pandoc
  if (Array.isArray(hProperties.class)) {
    // `remark-attr` may add classes, so make sure they come before them (always top)
    hProperties.class.unshift(`level${depth}`);
  } else {
    hProperties.class = [`level${depth}`];
  }

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
}

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
