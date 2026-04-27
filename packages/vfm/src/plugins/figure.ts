import type { Element, Properties } from 'hast';
import type { Image, Paragraph } from 'mdast';
import { type H, all } from 'mdast-util-to-hast';
import { u } from 'unist-builder';

export const propertyToString = (
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
  /** Order of img and figcaption elements in figure. */
  imgFigcaptionOrder?: ImgFigcaptionOrder | undefined;
  /** Assign ID to figcaption instead of img/code. */
  assignIdToFigcaption?: boolean | undefined;
};

const isFigureImage = (child: unknown): child is Image & { alt: string } => {
  if (!child || typeof child !== 'object') return false;
  const node = child as { type?: unknown; alt?: unknown };
  return node.type === 'image' && typeof node.alt === 'string' && !!node.alt;
};

/**
 * Predicate: a paragraph qualifies as a figure when it contains exactly one
 * image child with non-empty `alt`. Exposed so callers composing their own
 * `paragraph` handler (e.g. for CJK whitespace handling, indent control) can
 * delegate the figure case without re-implementing this rule.
 */
export const isFigureParagraph = (
  node: unknown,
): node is Paragraph & { children: [Image & { alt: string }] } => {
  if (!node || typeof node !== 'object') return false;
  const n = node as { type?: unknown; children?: unknown };
  if (n.type !== 'paragraph') return false;
  if (!Array.isArray(n.children) || n.children.length !== 1) return false;
  return isFigureImage(n.children[0]);
};

/**
 * Build a `<figure>` element from a paragraph that satisfies
 * {@link isFigureParagraph}. Returns `undefined` for any other node, so
 * callers can fall through to their own default `<p>` rendering:
 *
 * ```ts
 * paragraph: (h, node) =>
 *   buildFigure(h, node, options) ?? h(node, 'p', all(h, node));
 * ```
 */
export const buildFigure = (
  h: H,
  node: unknown,
  {
    imgFigcaptionOrder = 'img-figcaption',
    assignIdToFigcaption = false,
  }: FigureOptions = {},
): Element | undefined => {
  if (!isFigureParagraph(node)) return undefined;

  const converted = all(h, node) as Element[];
  const img = converted[0];
  if (!img || !img.properties) return undefined;

  const figcaptionProps: Properties = { 'aria-hidden': 'true' };
  if (assignIdToFigcaption && img.properties.id) {
    figcaptionProps.id = img.properties.id;
    delete img.properties.id;
  }

  const altText = propertyToString(img.properties.alt);
  const figcaption = h({ type: 'element' }, 'figcaption', figcaptionProps, [
    u('text', altText),
  ]) as Element;

  const figureChildren =
    imgFigcaptionOrder === 'figcaption-img'
      ? [figcaption, img]
      : [img, figcaption];

  return h(node, 'figure', figureChildren) as Element;
};
