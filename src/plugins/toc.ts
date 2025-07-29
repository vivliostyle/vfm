import shortcodes from 'remark-shortcodes';
import { Node } from 'unist';
import remove from 'unist-util-remove';

const keepToC = () => (tree: Node) => {
  remove(tree, { cascade: false }, (node: any) => {
    return node.type === 'shortcode' && node.identifier !== 'toc';
  });
};

export const mdast = {
  plugins: [[shortcodes, { startBlock: '[[', endBlock: ']]' }], keepToC],
};
