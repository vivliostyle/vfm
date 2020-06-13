import visit from 'unist-util-visit';
import {Plugin} from 'unified';
import {Node} from 'unist';
import h from 'hastscript';
import is from 'hast-util-is-element';

interface HastNode extends Node {
  tagName: string;
  children: HastNode[];
}

export default imageHandler;

function imageHandler(options = {}) {
  function transformer(tree: Node, file: any) {
    return visit(tree, 'element', (node, index, parent) => {
      if (!is(node, 'img')) return;
      const {alt} = node.properties as any;
      if (!alt) return;
      (parent as HastNode).children[index] = h(
        'figure',
        node,
        h('figcaption', alt),
      );
    });
  }
  return transformer as Plugin;
}
