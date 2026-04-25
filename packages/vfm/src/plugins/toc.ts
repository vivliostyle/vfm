import shortcodes from 'remark-shortcodes';
import type { Node } from 'unist';
import { remove } from 'unist-util-remove';
import { mergePlugins, partial } from '../utils.js';

const keepToC = () => (tree: Node) => {
  remove(tree, { cascade: false }, (node: any) => {
    return node.type === 'shortcode' && node.identifier !== 'toc';
  });
};

export const mdast = mergePlugins(
  partial(shortcodes, { startBlock: '[[', endBlock: ']]' }),
  keepToC,
);
