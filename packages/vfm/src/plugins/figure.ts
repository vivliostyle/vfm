import type * as hast from 'hast';
import raw from 'hast-util-raw';
import type * as mdast from 'mdast';
import { type H, all, one } from 'mdast-util-to-hast';
import type unified from 'unified';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
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

export const FigcaptionInlineOptionsSchema = v.object({
  parseFigcaptionAsInline: v.optional(
    v.pipe(
      v.boolean(),
      v.description(
        'Re-parse figcaption text as inline markdown (math, ruby, emphasis, footnotes, etc.).',
      ),
    ),
  ),
});

export type FigcaptionInlineOptions = v.InferInput<
  typeof FigcaptionInlineOptionsSchema
>;

const DEFAULT_PARSE_FIGCAPTION_AS_INLINE = false;

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
 * Not a standard mdast `Image` shape, but in practice subsequent transforms
 * treat these `children` as genuine. This lets the caption be processed in the
 * body's context (e.g. a footnote in it participates in the document-wide
 * numbering).
 */
type ImageWithParsedCaption = mdast.Image & {
  children?: mdast.PhrasingContent[] | undefined;
};

const parseImageAltAsInline: unified.Plugin<[FigcaptionInlineOptions?]> =
  function ({
    parseFigcaptionAsInline = DEFAULT_PARSE_FIGCAPTION_AS_INLINE,
  }: FigcaptionInlineOptions = {}) {
    return !parseFigcaptionAsInline
      ? () => {}
      : (tree) => {
          visit(tree as mdast.Root, 'paragraph', (paragraph) => {
            const lone = loneImageParagraph(paragraph);
            if (!lone) {
              return;
            }
            const image: ImageWithParsedCaption = lone.mdastImage;
            if (!image.alt) {
              return;
            }
            // TODO: feeding raw, re-parseable Markdown text through `Image.alt`
            // relies on behavior specific to remark-parse@8.
            const root = this.parse(image.alt) as mdast.Root;
            const inline = root.children[0];
            if (inline?.type === 'paragraph') {
              image.children = inline.children;
            }
          });
        };
  };

export { parseImageAltAsInline as mdast };

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
  const { mdastParagraph } = lone;
  const mdastImage: ImageWithParsedCaption = lone.mdastImage;

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

  const altText = mdastImage.alt ?? '';

  // By default the <figcaption> is aria-hidden so assistive technology does
  // not expose it and alt as duplicates (#75). But when an explicit {alt=...}
  // differs from it, exposing both is preferable for accessibility. See also
  // jgm/pandoc#6782.
  // An empty figcaption emitted by captionlessImagePolicy
  // 'figure-with-figcaption' stays hidden even with an explicit alt, to avoid
  // accessibility-tree noise.
  const explicitAlt = mdastImage.data?.hProperties?.alt;
  const figcaptionProps: hast.Properties =
    hasCaption && explicitAlt !== undefined && explicitAlt !== altText
      ? {}
      : { 'aria-hidden': 'true' };
  if (assignIdToFigcaption && hastImg.properties && hastImg.properties.id) {
    figcaptionProps.id = hastImg.properties.id;
    delete hastImg.properties.id;
  }

  const reparsed = !!mdastImage.children?.length;
  const figcaptionChildren = reparsed
    ? all(h, mdastImage)
    : [u('text', altText)];
  const figcaption = h(
    { type: 'element' },
    'figcaption',
    figcaptionProps,
    figcaptionChildren,
  );

  return h(
    mdastParagraph,
    'figure',
    imgFigcaptionOrder === 'figcaption-img'
      ? [figcaption, ...imgWithComments]
      : [...imgWithComments, figcaption],
  );
};

/** Whether a node is exposed to assistive tech (not `aria-hidden`/`hidden`). */
const isExposed = (node: hast.RootContent): boolean => {
  if (node.type !== 'element') return true;
  const props: hast.Properties = node.properties ?? {};
  const ariaHidden = props.ariaHidden ?? props['aria-hidden'];
  return !(
    ariaHidden === true ||
    ariaHidden === 'true' ||
    props.hidden === true
  );
};

/**
 * A hast-level Accessible Name Computation that captures the essence rather
 * than the full algorithm.
 * https://www.w3.org/TR/accname-1.2/
 * It works purely from the hast, so rendered-state factors such as CSS
 * visibility are out of scope. `aria-hidden`/`hidden` descendants are dropped,
 * but the node passed in is treated as directly referenced: its own hidden
 * state is ignored, so the `<figcaption>` VFM hides by design still yields a
 * name from its content.
 */
const accessibleName = (node: hast.RootContent | hast.Root): string => {
  if (node.type === 'element') {
    const props: hast.Properties = node.properties ?? {};
    const ariaLabel = props.ariaLabel ?? props['aria-label'];
    if (typeof ariaLabel === 'string' && ariaLabel) return ariaLabel;
    if (node.tagName === 'img') {
      return typeof props.alt === 'string' ? props.alt : '';
    }
    return node.children.filter(isExposed).map(accessibleName).join('');
  }
  if (node.type === 'text') return node.value;
  if (node.type === 'root') {
    return node.children.filter(isExposed).map(accessibleName).join('');
  }
  return '';
};

/**
 * Derive each figure image's `alt` from its rendered `<figcaption>`. Runs after
 * `rehype-raw` so inline HTML in a reparsed caption has been expanded into real
 * elements.
 *
 * CommonMark is not normative about what an `alt` may contain; it only
 * recommends "the plain string content"
 * (https://spec.commonmark.org/0.31.2/#images). Deriving it from the rendered
 * caption via accname departs from how typical CommonMark implementations
 * behave, but stays within that recommendation and is the more capable choice
 * for a conversion that targets HTML.
 */
const deriveImgAltFromFigcaption: unified.Plugin<
  [FigcaptionInlineOptions?]
> = ({
  parseFigcaptionAsInline = DEFAULT_PARSE_FIGCAPTION_AS_INLINE,
}: FigcaptionInlineOptions = {}) =>
  !parseFigcaptionAsInline
    ? () => {}
    : (tree) => {
        visit(tree as hast.Root, 'element', (figure) => {
          if (figure.tagName !== 'figure') return;
          const child = (tagName: string) =>
            figure.children.find(
              (c): c is hast.Element =>
                c.type === 'element' && c.tagName === tagName,
            );
          const img = child('img');
          const figcaption = child('figcaption');
          if (img && figcaption) {
            (img.properties ??= {}).alt = accessibleName(figcaption);
          }
        });
      };

export { deriveImgAltFromFigcaption as hast };
