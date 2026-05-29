/**
 * derived from `remark-sectionize`.
 * original: 2019 Jake Low
 * modified: 2020 Yasuaki Uechi, 2021 and later is Akabeko
 * @license MIT
 * @see https://github.com/jake-low/remark-sectionize
 */

import type * as hast from 'hast';
import type { BlockContent, Content, HTML, Heading, Parent } from 'mdast';
import type { Node } from 'unist';
import type { VFile } from 'vfile';
import { findAfter } from 'unist-util-find-after';
import { visitParents as visit } from 'unist-util-visit-parents';

export interface Section extends Parent {
  type: 'section';
  depth: number;
  children: BlockContent[];
}

declare module 'mdast' {
  interface BlockContentMap {
    section: Section;
  }
}

/**
 * @todo Drop the hast fields after upgrading to `mdast-util-to-hast@>=13`,
 *   which ships the same `Data` augmentation as a side effect import.
 */
declare module 'unist' {
  interface Data {
    hName?: string | undefined;
    hProperties?: hast.Properties | undefined;
  }
}

/** Maximum depth of hierarchy to process headings. */
const MAX_HEADING_DEPTH = 6;

/**
 * Create the attribute properties of a section.
 * @param depth - Depth of heading elements that are sections.
 * @returns Properties.
 */
const createProperties = (depth: number): KeyValue => {
  const properties: KeyValue = {
    class: [`level${depth}`],
  };
  return properties;
};

const getHeadingLine = (node: Node, file: VFile): string => {
  if (node.type !== 'heading') {
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
const hasNonSectionMark = (node: Heading, file: VFile): boolean => {
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
const isSectionEndMark = (node: Node, file: VFile): boolean => {
  if (node.type !== 'heading') return false;
  const heading = node as Heading;
  const line = getHeadingLine(heading, file);
  return !!line && /^(#+)$/.exec(line)?.[1]?.length === heading.depth;
};

/**
 * Wrap the header in sections.
 * - Do not sectionize if parent is `blockquote`.
 * - Set the `levelN` class in the section to match the heading depth.
 * @param node Node of Markdown AST.
 * @param ancestors Parents.
 * @todo handle `@subtitle` properly.
 */
const sectionizeIfRequired = (
  node: Heading,
  ancestors: Parent[],
  file: VFile,
) => {
  if (hasNonSectionMark(node, file)) {
    return;
  }
  const parent = ancestors[ancestors.length - 1];
  if (!parent || parent.type === 'blockquote') {
    return;
  }

  const start = node;
  const depth = start.depth;

  // check if it's HTML end tag without corresponding start tag in sibling nodes.
  const isHtmlEnd = (node: Node) => {
    if (node.type !== 'html') {
      return false;
    }
    const html = node as HTML;

    const tag = /<\/([^>\s]+)\s*>[^<]*$/.exec(html.value)?.[1];
    if (!tag) {
      return false;
    }

    // it's HTML end tag, check if it has corresponding start tag
    const isHtmlStart = (node: Node) =>
      node.type === 'html' &&
      new RegExp(`<${tag}\\b[^>]*>`).test((node as HTML).value);
    const htmlStart = findAfter(parent, start, isHtmlStart);
    if (
      !htmlStart ||
      parent.children.indexOf(htmlStart as Content) >
        parent.children.indexOf(html as Content)
    ) {
      // corresponding start tag is not found in this section level,
      // check if it is found earlier.
      const htmlStart1 = findAfter(parent, 0, isHtmlStart);
      if (
        htmlStart1 &&
        parent.children.indexOf(htmlStart1 as Content) <
          parent.children.indexOf(start as Content)
      ) {
        return true;
      }
    }
    return false;
  };

  const isEnd = (node: Node) =>
    (node.type === 'heading' && (node as Heading).depth <= depth) ||
    node.type === 'export' ||
    isHtmlEnd(node);
  const end = findAfter(parent, start, isEnd);

  const startIndex = parent.children.indexOf(start as Content);
  const endIndex = end ? parent.children.indexOf(end as Content) : -1;

  const between = parent.children.slice(
    startIndex,
    endIndex > 0 ? endIndex : undefined,
  );

  const hProperties = createProperties(depth);

  // {hidden} specifier
  if (node.data?.hProperties && 'hidden' in node.data.hProperties) {
    node.data.hProperties.hidden = 'hidden';
  }

  const isDuplicated = parent.type === 'section';
  if (isDuplicated) {
    if (parent.data?.hProperties) {
      parent.data.hProperties = {
        ...parent.data.hProperties,
        ...hProperties,
      };
    }
    return;
  }

  const section: Section = {
    type: 'section',
    data: {
      hName: 'section',
      hProperties,
    },
    depth,
    children: between as BlockContent[],
  };

  parent.children.splice(
    startIndex,
    section.children.length +
      (end && isSectionEndMark(end, file) && (end as Heading).depth === depth
        ? 1
        : 0),
    section,
  );
};

/**
 * Process Markdown AST.
 * @returns Transformer.
 */
export const mdast = () => (tree: Node, file: VFile) => {
  const sectionize = (node: Node, ancestors: Parent[]) => {
    sectionizeIfRequired(node as Heading, ancestors, file);
  };
  for (let depth = MAX_HEADING_DEPTH; depth > 0; depth--) {
    visit(
      tree,
      (node: Node) =>
        node.type === 'heading' && (node as Heading).depth === depth,
      sectionize,
    );
  }
};
