import is from 'hast-util-is-element';
import katex from 'rehype-katex';
import { Node } from 'unist';
import remove from 'unist-util-remove';

const removeMathML = () => (tree: Node) => {
  remove(tree, (node: any) => {
    const isKatexMathML = node.properties?.className?.includes('katex-mathml');
    return is(node, 'span') && isKatexMathML;
  });
};

export const hast = { plugins: [katex, removeMathML] };
