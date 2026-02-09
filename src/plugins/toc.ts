import type { Root, Text } from 'mdast';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

/**
 * Custom [[toc]] detector (replaces remark-shortcodes).
 * Converts paragraphs containing only `[[toc]]` into shortcode nodes.
 */
export const mdast = () => (tree: Node) => {
  visit(tree as Root, 'paragraph', (node: any, index, parent) => {
    if (
      node.children.length === 1 &&
      node.children[0].type === 'text' &&
      /^\[\[toc\]\]$/i.test((node.children[0] as Text).value.trim())
    ) {
      // Replace paragraph with shortcode node
      const shortcode = {
        type: 'shortcode',
        identifier: 'toc',
        attributes: {},
      };
      if (parent && typeof index === 'number') {
        (parent as any).children[index] = shortcode;
      }
    }
  });
};
