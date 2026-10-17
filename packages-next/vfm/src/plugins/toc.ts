import type { Node as MdastNode } from 'mdast';
// TODO(#290): remark-shortcodes patches the remark-parse 8 parser and is a
// no-op under remark-parse 11, so `[[toc]]` is not recognized until it is
// replaced (or dropped, see #207).
import shortcodes from 'remark-shortcodes';
import type { Node } from 'unist';
import { remove } from 'unist-util-remove';
import { mergePlugins, partial } from '../utils.js';

/**
 * Block-level shortcode node emitted by `remark-shortcodes`.
 * @see https://github.com/djm/remark-shortcodes#example
 */
export interface Shortcode extends MdastNode {
  type: 'shortcode';
  identifier: string;
  attributes: Record<string, string>;
}

declare module 'mdast' {
  interface BlockContentMap {
    shortcode: Shortcode;
  }
  interface RootContentMap {
    shortcode: Shortcode;
  }
}

/**
 * remark plugin: remove every shortcode except `[[toc]]`.
 * @returns Transformer.
 */
const keepToC = () => (tree: Node) => {
  remove(
    tree,
    { cascade: false },
    (node: Node) =>
      node.type === 'shortcode' && (node as Shortcode).identifier !== 'toc',
  );
};

export const mdast = mergePlugins(
  partial(shortcodes, { startBlock: '[[', endBlock: ']]' }),
  keepToC,
);
