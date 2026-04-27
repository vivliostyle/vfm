import type * as hast from 'hast';
import type * as mdast from 'mdast';
import { type H, all } from 'mdast-util-to-hast';
import { u } from 'unist-builder';

export type ImgFigcaptionOrder = 'img-figcaption' | 'figcaption-img';

/**
 * Rendering policy for an image-only paragraph whose `alt` is empty
 * (e.g. `![](url)`). Controls the output structure independently of the
 * captioned case, which always renders as `<figure><img><figcaption>...`.
 *
 * - `'paragraph'`: keep `<p><img></p>` (default; backward compatible).
 * - `'figure'`: emit `<figure><img></figure>` with no figcaption slot.
 * - `'figure-with-figcaption'`: emit `<figure><img><figcaption></figcaption></figure>`
 *   so CSS counters and `imgFigcaptionOrder`/`assignIdToFigcaption` apply
 *   uniformly across captioned and captionless cases.
 */
export type CaptionlessImagePolicy =
  | 'paragraph'
  | 'figure'
  | 'figure-with-figcaption';

export type FigureOptions = {
  /** Order of img and figcaption elements in figure. */
  imgFigcaptionOrder?: ImgFigcaptionOrder | undefined;
  /** Assign ID to figcaption instead of img/code. */
  assignIdToFigcaption?: boolean | undefined;
  /** How to render an image-only paragraph whose `alt` is empty. */
  captionlessImagePolicy?: CaptionlessImagePolicy | undefined;
};

const isImageNode = (
  maybeMdastNode: unknown,
): maybeMdastNode is mdast.Image => {
  if (!maybeMdastNode || typeof maybeMdastNode !== 'object') return false;
  return (maybeMdastNode as { type?: unknown }).type === 'image';
};

/**
 * Predicate: a paragraph is figure-shaped when it contains exactly one image
 * child. This is a pure structural check and does not consider `alt` content.
 * Whether such a paragraph should actually become a `<figure>` is a policy
 * decision left to {@link buildFigure}, which weighs `alt` and
 * {@link FigureOptions} together.
 *
 * Exposed so callers composing their own `paragraph` handler (e.g. for CJK
 * whitespace handling, indent control) can inspect figure candidacy.
 */
export const isFigureParagraph = (
  maybeMdastNode: unknown,
): maybeMdastNode is mdast.Paragraph & { children: [mdast.Image] } => {
  if (!maybeMdastNode || typeof maybeMdastNode !== 'object') return false;
  const n = maybeMdastNode as { type?: unknown; children?: unknown };
  if (n.type !== 'paragraph') return false;
  if (!Array.isArray(n.children) || n.children.length !== 1) return false;
  return isImageNode(n.children[0]);
};

/**
 * Build a `<figure>` element from a figure-shaped paragraph. Returns
 * `undefined` when the node is not figure-shaped, or when its image lacks an
 * `alt` and `captionlessImagePolicy` is `'paragraph'` (the default). Callers
 * compose this with their own `<p>` fallback:
 *
 * ```ts
 * paragraph: (h, node) =>
 *   buildFigure(h, node, options) ?? h(node, 'p', all(h, node));
 * ```
 */
export const buildFigure = (
  h: H,
  maybeMdastNode: unknown,
  {
    imgFigcaptionOrder = 'img-figcaption',
    assignIdToFigcaption = false,
    captionlessImagePolicy = 'paragraph',
  }: FigureOptions = {},
): hast.Element | undefined => {
  if (!isFigureParagraph(maybeMdastNode)) return undefined;

  const hasCaption = !!maybeMdastNode.children[0].alt;
  if (!hasCaption && captionlessImagePolicy === 'paragraph') return undefined;

  const converted = all(h, maybeMdastNode);
  const img = converted[0];
  if (img?.type !== 'element') return undefined;

  if (!hasCaption && captionlessImagePolicy === 'figure') {
    return h(maybeMdastNode, 'figure', [img]);
  }

  const figcaptionProps: hast.Properties = { 'aria-hidden': 'true' };
  if (assignIdToFigcaption && img.properties && img.properties.id) {
    figcaptionProps.id = img.properties.id;
    delete img.properties.id;
  }

  const altText = maybeMdastNode.children[0].alt ?? '';
  const figcaption = h({ type: 'element' }, 'figcaption', figcaptionProps, [
    u('text', altText),
  ]);

  const figureChildren =
    imgFigcaptionOrder === 'figcaption-img'
      ? [figcaption, img]
      : [img, figcaption];

  return h(maybeMdastNode, 'figure', figureChildren);
};
