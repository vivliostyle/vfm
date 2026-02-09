/**
 * derived from `remark-sectionize`.
 * original: 2019 Jake Low
 * modified: 2020 Yasuaki Uechi, 2021 and later is Akabeko
 * @license MIT
 * @see https://github.com/jake-low/remark-sectionize
 */

import type { Parent, Root, RootContent } from 'mdast';
import { VFile } from 'vfile';
import { findAfter } from 'unist-util-find-after';
import { visitParents as visit } from 'unist-util-visit-parents';

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
  return properties;
};

const getHeadingLine = (node: any, file: VFile): string => {
  if (node?.type !== 'heading') {
    return '';
  }
  const startOffset = node.position?.start.offset ?? 0;
  const endOffset = node.position?.end.offset ?? 0;
  const text = file.toString().slice(startOffset, endOffset);
  return text.trim();
};

/**
 * Check if the heading has a non-section mark (sufficient number of closing hashes).
 * @param node Node of Markdown AST.
 * @param file Virtual file.
 * @returns `true` if the node has a non-section mark.
 */
const hasNonSectionMark = (node: any, file: VFile): boolean => {
  const line = getHeadingLine(node, file);
  return (
    !!line && (/^#.*[ \t](#+)$/.exec(line)?.[1]?.length ?? 0) >= node.depth
  );
};

/**
 * Check if the node is a section-end mark (line with only hashes).
 * @param node Node of Markdown AST.
 * @returns `true` if the node is a section-end mark.
 */
const isSectionEndMark = (node: any, file: VFile): boolean => {
  const line = getHeadingLine(node, file);
  return !!line && /^(#+)$/.exec(line)?.[1]?.length === node.depth;
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

  // check if it's HTML end tag without corresponding start tag in sibling nodes.
  const isHtmlEnd = (node: any) => {
    if (node.type !== 'html') {
      return false;
    }

    const tag = /<\/([^>\s]+)\s*>[^<]*$/.exec(node.value)?.[1];
    if (!tag) {
      return false;
    }

    // it's HTML end tag, check if it has corresponding start tag
    const isHtmlStart = (node: any) =>
      node.type === 'html' && new RegExp(`<${tag}\\b[^>]*>`).test(node.value);
    const htmlStart = findAfter(parent, start, isHtmlStart as any);
    if (
      !htmlStart ||
      parent.children.indexOf(htmlStart as RootContent) > parent.children.indexOf(node)
    ) {
      // corresponding start tag is not found in this section level,
      // check if it is found earlier.
      const htmlStart1 = findAfter(parent, 0, isHtmlStart as any);
      if (
        htmlStart1 &&
        parent.children.indexOf(htmlStart1 as RootContent) < parent.children.indexOf(start)
      ) {
        return true;
      }
    }
    return false;
  };

  const isEnd = (node: any) =>
    (node.type === 'heading' && node.depth <= depth) ||
    node.type === 'export' ||
    isHtmlEnd(node);
  const end = findAfter(parent, start, isEnd as any) as RootContent | undefined;

  const startIndex = parent.children.indexOf(start);
  const endIndex = end ? parent.children.indexOf(end) : -1;

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

  parent.children.splice(
    startIndex,
    section.children.length +
      (end && isSectionEndMark(end, file) && (end as any).depth === depth ? 1 : 0),
    section,
  );
};

/**
 * Process Markdown AST.
 * @returns Transformer.
 */
export const mdast = () => (tree: any, file: VFile) => {
  const sectionize = (node: any, ancestors: Parent[]) => {
    sectionizeIfRequired(node, ancestors, file);
  };
  for (let depth = MAX_HEADING_DEPTH; depth > 0; depth--) {
    visit(
      tree as Root,
      (node: any) => {
        return node.type === 'heading' && node.depth === depth;
      },
      sectionize as any,
    );
  }
};
