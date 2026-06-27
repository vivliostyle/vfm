import { type Handler, all } from 'mdast-util-to-hast';
import raw from 'rehype-raw';
import unified from 'unified';
import { handler as code, type CodeOptions } from './plugins/code.js';
import { mdast as doc, type DocumentOptions } from './plugins/document.js';
import {
  buildFigure,
  hast as deriveImgAltFromFigcaption,
  type FigcaptionInlineOptions,
  type FigureOptions,
} from './plugins/figure.js';
import {
  createFootnotePlugin,
  type FootnoteOptions,
} from './plugins/footnotes.js';
import { hast as format, type FormatOptions } from './plugins/format.js';
import {
  hast as math,
  buildDisplayMath,
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
  type MathOptions,
} from './plugins/math.js';
import { replace, type ReplaceOptions } from './plugins/replace.js';
import {
  rewriteRelativeHrefExtensions,
  type RewriteRelativeHrefExtensionsOptions,
} from './plugins/rewrite-relative-href-extensions.js';
import { createTableHandler, type TableOptions } from './plugins/table.js';
import { handler as ruby } from '@vivliostyle/remark-ruby';
import { brand, partial } from './utils.js';

export type ReviveRehypeOptions = FigureOptions &
  FigcaptionInlineOptions &
  CodeOptions &
  FootnoteOptions &
  ReplaceOptions &
  DocumentOptions &
  MathOptions &
  FormatOptions &
  RewriteRelativeHrefExtensionsOptions &
  TableOptions;

declare const rehypeRawPluginBrand: unique symbol;
export type RehypeRawPlugin = unified.Pluggable & {
  [rehypeRawPluginBrand]: unknown;
};

declare const rehypeDeriveImgAltFromFigcaptionPluginBrand: unique symbol;
export type RehypeDeriveImgAltFromFigcaptionPlugin = unified.Pluggable & {
  [rehypeDeriveImgAltFromFigcaptionPluginBrand]: unknown;
};

declare const rehypeFootnotePluginBrand: unique symbol;
export type RehypeFootnotePlugin = unified.Pluggable & {
  [rehypeFootnotePluginBrand]: unknown;
};

declare const rehypeReplacePluginBrand: unique symbol;
export type RehypeReplacePlugin = unified.Pluggable & {
  [rehypeReplacePluginBrand]: unknown;
};

declare const rehypeDocumentPluginBrand: unique symbol;
export type RehypeDocumentPlugin = unified.Pluggable & {
  [rehypeDocumentPluginBrand]: unknown;
};

declare const rehypeMathPluginBrand: unique symbol;
export type RehypeMathPlugin = unified.Pluggable & {
  [rehypeMathPluginBrand]: unknown;
};

declare const rehypeFormatPluginBrand: unique symbol;
export type RehypeFormatPlugin = unified.Pluggable & {
  [rehypeFormatPluginBrand]: unknown;
};

declare const rehypeRewriteRelativeHrefExtensionsPluginBrand: unique symbol;
export type RehypeRewriteRelativeHrefExtensionsPlugin = unified.Pluggable & {
  [rehypeRewriteRelativeHrefExtensionsPluginBrand]: unknown;
};

/**
 * Create Hypertext AST handlers and transformers.
 * @param options Options for rehype transformers.
 * @returns Handlers and transformers.
 */
export const reviveRehype = (options: ReviveRehypeOptions) => {
  const {
    toHastHandlers: footnoteHandlers,
    hastTransformer: footnoteTransformer,
  } = createFootnotePlugin(options);
  return {
    mdastToHastHandlers: {
      displayMath: displayMath(options),
      inlineMath: inlineMath(options),
      ruby,
      code: code(options),
      paragraph: ((h, node) =>
        buildDisplayMath(node, options) ??
        buildFigure(h, node, options) ??
        h(node, 'p', all(h, node))) as Handler,
      table: createTableHandler(options),
      ...footnoteHandlers,
    } as const,
    hastPlugins: [
      brand<RehypeRawPlugin>(raw),
      // Must run after `rehype-raw`: it reads the expanded figcaption.
      brand<RehypeDeriveImgAltFromFigcaptionPlugin>(
        partial(deriveImgAltFromFigcaption, options),
      ),
      brand<RehypeFootnotePlugin>(footnoteTransformer),
      brand<RehypeReplacePlugin>(partial(replace, options)),
      brand<RehypeRewriteRelativeHrefExtensionsPlugin>(
        partial(rewriteRelativeHrefExtensions, options),
      ),
      brand<RehypeDocumentPlugin>(partial(doc, options)),
      // Must be run after `rehype-document` to write to `<head>`
      brand<RehypeMathPlugin>(partial(math, options)),
      // Explicitly specify true if want unformatted HTML during development or debug
      brand<RehypeFormatPlugin>(format(options)),
    ] as const,
  };
};
