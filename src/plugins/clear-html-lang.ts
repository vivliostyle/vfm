import { Node } from 'unist';
import visit from 'unist-util-visit-parents';
import { HastNode } from './hastnode';

/**
 * Clear the lang attribute of the html tag.
 *
 * rehype-document omits the `language` option and set `<html lang="en">`. However, the default value for this attribute is preferably unset, so if the `language` option as VFM is omitted, this function explicitly unset it.
 */
export const hast = () => (tree: Node) => {
  visit<HastNode>(tree, 'element', (node) => {
    if (node.tagName === 'html' && node.properties && node.properties.lang) {
      node.properties.lang = undefined;
    }
  });
};
