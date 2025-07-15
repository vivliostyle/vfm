import { Element } from 'hast';
import is from 'hast-util-is-element';
import { h } from 'hastscript';
import { Node, Parent } from 'unist';
import visit from 'unist-util-visit';

/**
 * Wrap the single line `<img>` in `<figure>` and generate `<figcaption>` from the `alt` attribute.
 *
 * A single line `<img>` is a child of `<p>` with no sibling elements. Also, `<figure>` cannot be a child of `<p>`. So convert the parent `<p>` to `<figure>`.
 * @param img `<img>` tag.
 * @param parent `<p>` tag.
 */
const wrapFigureImg = (img: Element, parent: Element) => {
  if (!(img.properties && parent.properties)) {
    return;
  }

  parent.tagName = 'figure';
  parent.children.push(
    h('figcaption', { 'aria-hidden': 'true' }, [img.properties.alt]),
  );
};

export const hast = () => (tree: Node) => {
  visit<Element>(tree, 'element', (node, index, parent) => {
    // handle captioned code block
    const maybeCode = node.children?.[0] as Element | undefined;
    if (
      is(node, 'pre') &&
      maybeCode?.properties &&
      maybeCode.properties.title
    ) {
      const maybeTitle = maybeCode.properties.title;
      delete maybeCode.properties.title;
      if (Array.isArray(maybeCode.properties.className)) {
        (parent as Parent).children[index] = h(
          'figure',
          { class: maybeCode.properties.className[0] },
          h('figcaption', maybeTitle),
          node,
        );
      }

      return;
    }

    // handle captioned and single line (like a block) img
    if (
      is(node, 'img') &&
      node.properties?.alt &&
      parent &&
      parent.tagName === 'p' &&
      parent.children.length === 1
    ) {
      wrapFigureImg(node, parent as Element);
    }
  });
};
