import type * as hast from 'hast';
import { raw } from 'hast-util-raw';
import type * as mdast from 'mdast';
import type { State } from 'mdast-util-to-hast';
import type { Plugin } from 'unified';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';
import type { VFile } from 'vfile';

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

/**
 * Whether a value is an mdast `image` node.
 * @param maybeMdastNode - Value to test.
 * @returns `true` for an `image` node.
 */
const isImageNode = (
  maybeMdastNode: unknown,
): maybeMdastNode is mdast.Image => {
  if (!maybeMdastNode || typeof maybeMdastNode !== 'object') return false;
  return (maybeMdastNode as { type?: unknown }).type === 'image';
};

/**
 * Parse an HTML string into a hast root.
 * @param value - HTML.
 * @returns Root.
 */
const parseHtml = (value: string): hast.Root =>
  raw(u('root', [u('raw', value)])) as hast.Root;

/**
 * Whether an mdast `html` node consists of comments only, so that it does not
 * count as content next to an image.
 * @param node - Value to test.
 * @returns `true` for comment-only HTML.
 */
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

/**
 * Find the single image of a paragraph that holds nothing else but HTML
 * comments.
 * @param maybeMdastNode - Value to test.
 * @returns The paragraph and its image, or `undefined`.
 */
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

/**
 * Find the end of a code span that opened with a run of `run` backticks.
 * @param text - Text to scan.
 * @param from - Index right after the opening run.
 * @param run - Length of the opening backtick run.
 * @returns Index of the closing run, or `-1` when the span is not closed.
 */
const findCodeSpanEnd = (text: string, from: number, run: number): number => {
  let index = from;
  while (index < text.length) {
    if (text[index] !== '`') {
      index++;
      continue;
    }
    let length = 0;
    while (text[index + length] === '`') length++;
    if (length === run) return index;
    index += length;
  }
  return -1;
};

/**
 * Cut the label source (the `...` of `![...](url)`) out of the Markdown
 * source, using the position of the image node.
 *
 * micromark decodes `Image.alt` to plain text (`**bold**` becomes `bold`,
 * `\*` becomes `*`), so the alt can no longer be re-parsed the way the
 * remark-parse 8 version did. The label ends at the first `]` that is not
 * escaped, not inside a code span and not closing a nested bracket pair,
 * which is how CommonMark delimits link text.
 * @param source - Markdown source of the document.
 * @param image - Image node with position information.
 * @returns Label source, or `undefined` when it cannot be located.
 */
export const sliceImageLabel = (
  source: string,
  image: mdast.Image,
): string | undefined => {
  const start = image.position?.start.offset;
  const end = image.position?.end.offset;
  if (start === undefined || end === undefined) return undefined;
  const text = source.slice(start, end);
  if (!text.startsWith('![')) return undefined;

  let depth = 0;
  let index = 2;
  while (index < text.length) {
    const char = text[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '`') {
      let run = 0;
      while (text[index + run] === '`') run++;
      const close = findCodeSpanEnd(text, index + run, run);
      index = close === -1 ? index + run : close + run;
      continue;
    }
    if (char === '[') {
      depth++;
    } else if (char === ']') {
      if (depth === 0) return text.slice(2, index);
      depth--;
    }
    index++;
  }
  return undefined;
};

/**
 * Collect the link and footnote definitions of a document as Markdown lines.
 *
 * A caption is re-parsed on its own, but `[^1]` is only a footnote call when
 * the GFM footnote syntax finds a definition for it in the same parse, and a
 * `[text][x]` reference is only resolved against a definition. Appending the
 * document's definitions to the caption makes both work; the definition
 * content is irrelevant because the resulting nodes are moved into the
 * document tree, where the real definitions are.
 * @param tree - Document tree.
 * @returns Definition lines, possibly empty.
 */
const collectDefinitions = (tree: mdast.Root): string[] => {
  const lines: string[] = [];
  visit(tree, (node) => {
    if (node.type === 'footnoteDefinition') {
      lines.push(`[^${node.label ?? node.identifier}]: .`);
    } else if (node.type === 'definition') {
      lines.push(`[${node.label ?? node.identifier}]: ${node.url}`);
    }
  });
  return lines;
};

/**
 * remark plugin: when `parseFigcaptionAsInline` is on, re-parse the caption of
 * lone images as inline Markdown and attach the result as `children`.
 *
 * The caption is taken from the Markdown source ({@link sliceImageLabel}) and
 * parsed with the same processor, so every registered syntax (ruby, math,
 * attributes, footnotes, ...) applies and escapes are honored. When the label
 * cannot be located the figcaption keeps the literal alt text.
 * @param options - Figcaption options.
 * @returns Transformer.
 */
const parseImageAltAsInline: Plugin<[FigcaptionInlineOptions?], mdast.Root> =
  function ({
    parseFigcaptionAsInline = DEFAULT_PARSE_FIGCAPTION_AS_INLINE,
  }: FigcaptionInlineOptions = {}) {
    return !parseFigcaptionAsInline
      ? () => {}
      : (tree: mdast.Root, file: VFile) => {
          const source = String(file);
          const definitions = collectDefinitions(tree);
          const suffix =
            definitions.length > 0 ? `\n\n${definitions.join('\n')}` : '';
          visit(tree, 'paragraph', (paragraph) => {
            const lone = loneImageParagraph(paragraph);
            if (!lone) {
              return;
            }
            const image: ImageWithParsedCaption = lone.mdastImage;
            if (!image.alt) {
              return;
            }
            const label = sliceImageLabel(source, image);
            if (label === undefined) {
              return;
            }
            const root = this.parse(label + suffix) as mdast.Root;
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
 * paragraph: (state, node, parent) =>
 *   buildFigure(state, node, options) ??
 *   defaultHandlers.paragraph(state, node, parent);
 * ```
 */
export const buildFigure = (
  state: State,
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

  const hastImg = state.one(mdastImage, mdastParagraph);
  if (!hastImg || Array.isArray(hastImg) || hastImg.type !== 'element') {
    return undefined;
  }

  /**
   * Convert the paragraph's other children (HTML comments) to hast.
   * @param children - Phrasing content.
   * @returns Element content.
   */
  const toHast = (children: mdast.PhrasingContent[]): hast.ElementContent[] =>
    children.flatMap((child) => state.one(child, mdastParagraph) ?? []);
  const at = mdastParagraph.children.indexOf(mdastImage);
  const imgWithComments = [
    ...toHast(mdastParagraph.children.slice(0, at)),
    hastImg,
    ...toHast(mdastParagraph.children.slice(at + 1)),
  ];

  /**
   * Build `<figure>` in place of the paragraph: copy its position and honor its
   * `data` (`hProperties` etc.) like the default paragraph handler does.
   * @param children - Figure children.
   * @returns Figure element.
   */
  const figureOf = (children: hast.ElementContent[]): hast.Element => {
    const figure: hast.Element = {
      type: 'element',
      tagName: 'figure',
      properties: {},
      children,
    };
    state.patch(mdastParagraph, figure);
    return state.applyData(mdastParagraph, figure) as hast.Element;
  };

  if (!hasCaption && captionlessImagePolicy === 'figure') {
    return figureOf(imgWithComments);
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
      : { ariaHidden: 'true' };
  if (assignIdToFigcaption && hastImg.properties && hastImg.properties.id) {
    figcaptionProps.id = hastImg.properties.id;
    delete hastImg.properties.id;
  }

  const reparsed = !!mdastImage.children?.length;
  // `Image.children` is VFM's own extension of the node (see
  // `ImageWithParsedCaption`); `state.all` only needs `children` at runtime.
  const figcaptionChildren = reparsed
    ? state.all(mdastImage as unknown as mdast.Paragraph)
    : [u('text', altText)];
  const figcaption: hast.Element = {
    type: 'element',
    tagName: 'figcaption',
    properties: figcaptionProps,
    children: figcaptionChildren,
  };

  return figureOf(
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
const deriveImgAltFromFigcaption: Plugin<
  [FigcaptionInlineOptions?],
  hast.Root
> = ({
  parseFigcaptionAsInline = DEFAULT_PARSE_FIGCAPTION_AS_INLINE,
}: FigcaptionInlineOptions = {}) =>
  !parseFigcaptionAsInline
    ? () => {}
    : (tree: hast.Root) => {
        visit(tree, 'element', (figure) => {
          if (figure.tagName !== 'figure') return;
          /**
           * Find the direct child element of the figure with `tagName`.
           * @param tagName - Element name.
           * @returns Element, or `undefined`.
           */
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
