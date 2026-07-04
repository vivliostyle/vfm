import type * as hast from 'hast';
import raw from 'hast-util-raw';
import type * as mdast from 'mdast';
import { type H, one } from 'mdast-util-to-hast';
import { u } from 'unist-builder';
import * as v from 'valibot';

// Expressed as `v.union` of `v.literal` so consumers' schema walkers
// (e.g. vivliostyle-cli's update-docs) can render the type via the
// existing union+literal branch without needing picklist support.
export const ImgFigcaptionOrderSchema = v.union([
  v.literal('img-figcaption'),
  v.literal('figcaption-img'),
]);
export type ImgFigcaptionOrder = v.InferInput<typeof ImgFigcaptionOrderSchema>;

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
export const CaptionlessImagePolicySchema = v.union([
  v.literal('paragraph'),
  v.literal('figure'),
  v.literal('figure-with-figcaption'),
]);
export type CaptionlessImagePolicy = v.InferInput<
  typeof CaptionlessImagePolicySchema
>;

export const FigureOptionsSchema = v.object({
  imgFigcaptionOrder: v.optional(
    v.pipe(
      ImgFigcaptionOrderSchema,
      v.description('Order of img and figcaption elements in figure.'),
    ),
  ),
  assignIdToFigcaption: v.optional(
    v.pipe(
      v.boolean(),
      v.description('Assign ID to figcaption instead of img/code.'),
    ),
  ),
  captionlessImagePolicy: v.optional(
    v.pipe(
      CaptionlessImagePolicySchema,
      v.description(
        'How to render an image-only paragraph whose `alt` is empty.',
      ),
    ),
  ),
});

export type FigureOptions = v.InferInput<typeof FigureOptionsSchema>;

const isImageNode = (
  maybeMdastNode: unknown,
): maybeMdastNode is mdast.Image => {
  if (!maybeMdastNode || typeof maybeMdastNode !== 'object') return false;
  return (maybeMdastNode as { type?: unknown }).type === 'image';
};

const parseHtml = (value: string): hast.Root =>
  raw(u('root', [u('raw', value)])) as hast.Root;

const isHtmlComment = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false;
  const { type, value } = node as { type?: unknown; value?: unknown };
  if (type !== 'html' || typeof value !== 'string') return false;
  const { children } = parseHtml(value);
  // For broken input like an orphan close tag, avoid `[].every(...)` being
  // vacuously true on an empty parse. It is broken either way; see the
  // "garbage in, garbage out" tests for the output.
  return (
    children.length > 0 && children.every((child) => child.type === 'comment')
  );
};

const loneImageParagraph = (
  maybeMdastNode: unknown,
): { mdastParagraph: mdast.Paragraph; mdastImage: mdast.Image } | undefined => {
  if (!maybeMdastNode || typeof maybeMdastNode !== 'object') return undefined;
  const n = maybeMdastNode as { type?: unknown; children?: unknown };
  if (n.type !== 'paragraph') return undefined;
  if (!Array.isArray(n.children)) return undefined;
  const effective = n.children.filter((child) => !isHtmlComment(child));
  return effective.length === 1 && isImageNode(effective[0])
    ? {
        mdastParagraph: maybeMdastNode as mdast.Paragraph,
        mdastImage: effective[0],
      }
    : undefined;
};

/**
 * Build a `<figure>` from a lone-image paragraph. Returns `undefined` when the
 * node is not a lone-image paragraph, or when its image lacks an `alt` and
 * `captionlessImagePolicy` is `'paragraph'` (the default). Callers compose this
 * with their own `<p>` fallback:
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
  const lone = loneImageParagraph(maybeMdastNode);
  if (!lone) return undefined;
  const { mdastParagraph, mdastImage } = lone;

  const hasCaption = !!mdastImage.alt;
  if (!hasCaption && captionlessImagePolicy === 'paragraph') return undefined;

  const hastImg = one(h, mdastImage, mdastParagraph);
  if (!hastImg || Array.isArray(hastImg) || hastImg.type !== 'element') {
    return undefined;
  }

  const toHast = (children: mdast.PhrasingContent[]): hast.ElementContent[] =>
    children.flatMap((child) => one(h, child, mdastParagraph) ?? []);
  const at = mdastParagraph.children.indexOf(mdastImage);
  const imgWithComments = [
    ...toHast(mdastParagraph.children.slice(0, at)),
    hastImg,
    ...toHast(mdastParagraph.children.slice(at + 1)),
  ];

  if (!hasCaption && captionlessImagePolicy === 'figure') {
    return h(mdastParagraph, 'figure', imgWithComments);
  }

  const figcaptionProps: hast.Properties = { 'aria-hidden': 'true' };
  if (assignIdToFigcaption && hastImg.properties && hastImg.properties.id) {
    figcaptionProps.id = hastImg.properties.id;
    delete hastImg.properties.id;
  }

  const altText = mdastImage.alt ?? '';
  const figcaption = h({ type: 'element' }, 'figcaption', figcaptionProps, [
    u('text', altText),
  ]);

  return h(
    mdastParagraph,
    'figure',
    imgFigcaptionOrder === 'figcaption-img'
      ? [figcaption, ...imgWithComments]
      : [...imgWithComments, figcaption],
  );
};
