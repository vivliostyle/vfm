import { type Handler, all } from 'mdast-util-to-hast';
import raw from 'rehype-raw';
import unified from 'unified';
import { handler as code, type CodeOptions } from './plugins/code.js';
import { mdast as doc, type DocumentOptions } from './plugins/document.js';
import { buildFigure, type FigureOptions } from './plugins/figure.js';
import {
  createFootnotePlugin,
  type FootnoteOptions,
} from './plugins/footnotes.js';
import { hast as format, type FormatOptions } from './plugins/format.js';
import {
  hast as math,
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
  type MathOptions,
} from './plugins/math.js';
import { replace, type ReplaceOptions } from './plugins/replace.js';
import {
  rewriteLocalHrefExtensions,
  type RewriteLocalHrefExtensionsOptions,
} from './plugins/rewrite-local-href-extensions.js';
import { handler as ruby } from './plugins/ruby.js';
import { brand, partial } from './utils.js';

export type ReviveRehypeOptions = FigureOptions &
  CodeOptions &
  FootnoteOptions &
  ReplaceOptions &
  DocumentOptions &
  MathOptions &
  FormatOptions &
  RewriteLocalHrefExtensionsOptions;

declare const rehypeRawPluginBrand: unique symbol;
export type RehypeRawPlugin = unified.Pluggable & {
  [rehypeRawPluginBrand]: unknown;
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

declare const rehypeRewriteLocalHrefExtensionsPluginBrand: unique symbol;
export type RehypeRewriteLocalHrefExtensionsPlugin = unified.Pluggable & {
  [rehypeRewriteLocalHrefExtensionsPluginBrand]: unknown;
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
      displayMath,
      inlineMath,
      ruby,
      code: code(options),
      paragraph: ((h, node) =>
        buildFigure(h, node, options) ?? h(node, 'p', all(h, node))) as Handler,
      ...footnoteHandlers,
    } as const,
    hastPlugins: [
      brand<RehypeRawPlugin>(raw),
      brand<RehypeFootnotePlugin>(footnoteTransformer),
      brand<RehypeReplacePlugin>(partial(replace, options)),
      brand<RehypeRewriteLocalHrefExtensionsPlugin>(
        partial(rewriteLocalHrefExtensions, options),
      ),
      brand<RehypeDocumentPlugin>(partial(doc, options)),
      // Must be run after `rehype-document` to write to `<head>`
      brand<RehypeMathPlugin>(partial(math, options)),
      // Explicitly specify true if want unformatted HTML during development or debug
      brand<RehypeFormatPlugin>(format(options)),
    ] as const,
  };
};
