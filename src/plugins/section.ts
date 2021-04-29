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
 * Check the heading properties to generate properties for the parent `<section>` and update the heading style.
 * @param node Node of Markdown AST.
 * @returns Properties.
 */
const checkProperties = (node: any, depth: number) => {
  if (!node.data?.hProperties) {
    return undefined;
  }

  // Remove `id` attribute and copy otherwise for the parent `<section>`
  const hProperties = { ...node.data.hProperties };
  if (node.data.hProperties.id) {
    delete node.data.hProperties.id;
  }

  // {hidden} specifier
  if (Object.keys(hProperties).includes('hidden')) {
    node.data.hProperties.style = 'display: none;';
  }

  // output section levels like Pandoc
  if (Array.isArray(hProperties.class)) {
    // Switch references as they do not affect the heading,
    // and `remark-attr` may add classes, so make sure they come before them (always top)
    const classes = [...hProperties.class];
    classes.unshift(`level${depth}`);
    hProperties.class = classes;
  } else {
    hProperties.class = [`level${depth}`];
  }

  return hProperties;
};

/**
 * Wrap the header in sections.
 * @param node Node of Markdown AST.
 * @param ancestors Parents.
 * @todo handle `@subtitle` properly.
 */
const sectionize = (node: any, ancestors: Parent[]) => {
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

  const hProperties = checkProperties(node, depth);

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
