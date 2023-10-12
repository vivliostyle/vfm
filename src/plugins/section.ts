/**
 * derived from `remark-sectionize`.
 * original: 2019 Jake Low
 * modified: 2020 Yasuaki Uechi, 2021 and later is Akabeko
 * @license MIT
 * @see https://github.com/jake-low/remark-sectionize
 */

import { Parent } from 'mdast';
import { VFile } from 'vfile';
import findAfter from 'unist-util-find-after';
import visit from 'unist-util-visit-parents';

/** Maximum depth of hierarchy to process headings. */
const MAX_HEADING_DEPTH = 6;

/**
 * Create the attribute properties of a section.
 * @param depth - Depth of heading elements that are sections.
 * @param node - Node of Markdown AST.
 * @returns Properties.
 */
const createProperties = (depth: number, node: any): KeyValue => {
  const properties: KeyValue = {
    class: [`level${depth}`],
  };

  if (node?.data?.hProperties?.id) {
    properties['aria-labelledby'] = node?.data.hProperties.id;
  }

  return properties;
};

/**
 * Check if the heading has a non-section mark (sufficient number of closing hashes).
 * @param node Node of Markdown AST.
 * @param file Virtual file.
 * @returns `true` if the node has a non-section mark.
 */
const hasNonSectionMark = (node: any, file: VFile): boolean => {
  const startOffset = node.position?.start.offset ?? 0;
  const endOffset = node.position?.end.offset ?? 0;
  const text = file.toString().slice(startOffset, endOffset);
  const depth = node.depth;
  if ((/[ \t](#+)$/.exec(text)?.[1]?.length ?? 0) >= depth) {
    return true;
  }
  return false;
};

/**
 * Wrap the header in sections.
 * - Do not sectionize if parent is `blockquote`.
 * - Set the `levelN` class in the section to match the heading depth.
 * @param node Node of Markdown AST.
 * @param ancestors Parents.
 * @todo handle `@subtitle` properly.
 */
const sectionizeIfRequired = (node: any, ancestors: Parent[], file: VFile) => {
  if (hasNonSectionMark(node, file)) {
    return;
  }
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

  const hProperties = createProperties(depth, node);

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
export const mdast = () => (tree: any, file: VFile) => {
  const sectionize = (node: Node, ancestors: Parent[]) => {
    sectionizeIfRequired(node, ancestors, file);
  };
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
