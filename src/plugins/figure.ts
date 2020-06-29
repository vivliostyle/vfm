import is from 'hast-util-is-element';
import h from 'hastscript';
import {Node, Parent} from 'unist';
import visit from 'unist-util-visit';

interface HastNode extends Parent {
  properties: {[key: string]: any};
}

export function handler(options = {}) {
  return (tree: Node) => {
    visit<HastNode>(tree, 'element', (node, index, parent) => {
      // handle captioned code block
      const maybeCode = node.children?.[0] as HastNode | undefined;
      const maybeTitle = maybeCode?.properties?.title;
      if (is(node, 'pre') && maybeTitle) {
        delete maybeCode!.properties.title;
        (parent as Parent).children[index] = h(
          'figure',
          {class: maybeCode!.properties.className[0]},
          h('figcaption', maybeTitle),
          node,
        );
        return;
      }

      // handle captioned img
      if (is(node, 'img') && node.properties.alt) {
        (parent as Parent).children[index] = h(
          'figure',
          node,
          h('figcaption', node.properties.alt),
        );
      }
    });
  };
}
