import {Plugin} from 'unified';
import {Node, Parent} from 'unist';
import h from 'hastscript';
import is from 'hast-util-is-element';
import visit from 'unist-util-visit';

interface HastNode extends Parent {
  properties: {[key: string]: any};
}

export default function figureHandler(options = {}) {
  function transformer(tree: Node) {
    return visit<HastNode>(tree, 'element', (node, index, parent) => {
      if (!is(node, 'img')) return;

      const {alt} = node.properties;
      if (!alt) return;

      (parent as Parent).children[index] = h(
        'figure',
        node,
        h('figcaption', alt),
      );
    });
  }
  return transformer as Plugin;
}
