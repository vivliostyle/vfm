import type { Element, Properties, Root } from 'hast';
import { isElement as is } from 'hast-util-is-element';
import { h } from 'hastscript';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

const propertyToString = (
  property: NonNullable<Element['properties']>[string],
) => {
  return typeof property === 'string' || typeof property === 'number'
    ? String(property) // <tag prop="foo" /> || <tag prop=42 />
    : Array.isArray(property)
    ? property.map(String).join(' ') // <tag prop="foo 42 bar" />
    : ''; // <tag /> || <tag prop />
};

export type ImgFigcaptionOrder = 'img-figcaption' | 'figcaption-img';
export type FigureOptions = {
  imgFigcaptionOrder?: ImgFigcaptionOrder;
  assignIdToFigcaption?: boolean;
};

/**
 * Move ID from source element to target properties if assignIdToFigcaption is enabled.
 * @param source Element to move ID from (img or code).
 * @param targetProps Properties object to receive the ID.
 * @param options Figure options.
 */
const moveIdToFigcaption = (
  source: Element,
  targetProps: Properties,
  options: FigureOptions,
) => {
  if (options.assignIdToFigcaption && source.properties?.id) {
    targetProps.id = propertyToString(source.properties.id);
    delete source.properties.id;
  }
};

/**
 * Wrap the single line `<img>` in `<figure>` and generate `<figcaption>` from the `alt` attribute.
 *
 * A single line `<img>` is a child of `<p>` with no sibling elements. Also, `<figure>` cannot be a child of `<p>`. So convert the parent `<p>` to `<figure>`.
 * @param img `<img>` tag.
 * @param parent `<p>` tag.
 * @param options Figure options.
 */
const wrapFigureImg = (
  img: Element,
  parent: Element,
  options: FigureOptions,
) => {
  if (!(img.properties && parent.properties)) {
    return;
  }

  parent.tagName = 'figure';

  const figcaptionProps: Properties = { 'aria-hidden': 'true' };
  moveIdToFigcaption(img, figcaptionProps, options);

  const figcaption = h(
    'figcaption',
    figcaptionProps,
    propertyToString(img.properties.alt),
  );

  if (options.imgFigcaptionOrder === 'figcaption-img') {
    parent.children.unshift(figcaption);
  } else {
    parent.children.push(figcaption);
  }
};

export const hast =
  (options: FigureOptions = {}) =>
  (tree: Node) => {
    visit(tree as Root, 'element', (node, index, parent) => {
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
          const figcaptionProps: Properties = {};
          moveIdToFigcaption(maybeCode, figcaptionProps, options);

          (parent as Parent).children[index as number] = h(
            'figure',
            { class: maybeCode.properties.className[0] },
            h('figcaption', figcaptionProps, propertyToString(maybeTitle)),
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
        (parent as Element).tagName === 'p' &&
        parent.children.length === 1
      ) {
        wrapFigureImg(node, parent as Element, options);
      }
    });
  };
