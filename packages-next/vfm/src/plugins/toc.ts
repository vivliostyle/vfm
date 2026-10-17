import type { Content } from 'mdast';
import shortcodes from 'remark-shortcodes';
import type { Node } from 'unist';
import { remove } from 'unist-util-remove';
import { mergePlugins, partial } from '../utils.js';

/**
 * Block-level shortcode node emitted by `remark-shortcodes`.
 * @see https://github.com/djm/remark-shortcodes#example
 */
export interface Shortcode extends Node {
  type: 'shortcode';
  identifier: string;
  attributes: Record<string, string>;
}

declare module 'mdast' {
  interface BlockContentMap {
    shortcode: Shortcode;
  }
}

const keepToC = () => (tree: Node) => {
  remove(tree, { cascade: false }, (node: Node) => {
    const c = node as Content;
    return c.type === 'shortcode' && c.identifier !== 'toc';
  });
};

export const mdast = mergePlugins(
  partial(shortcodes, { startBlock: '[[', endBlock: ']]' }),
  keepToC,
);
