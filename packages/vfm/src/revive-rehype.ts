import raw from 'rehype-raw';
import unified from 'unified';
import { handler as code } from './plugins/code.js';
import { mdast as doc, type DocumentOptions } from './plugins/document.js';
import { hast as figure, type FigureOptions } from './plugins/figure.js';
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
import { handler as ruby } from './plugins/ruby.js';
import { brand, partial } from './utils.js';

export type ReviveRehypeOptions = FigureOptions &
  FootnoteOptions &
  ReplaceOptions &
  DocumentOptions &
  MathOptions &
  FormatOptions;

declare const rehypeRawPluginBrand: unique symbol;
export type RehypeRawPlugin = unified.Pluggable & {
  [rehypeRawPluginBrand]: unknown;
};

declare const rehypeFigurePluginBrand: unique symbol;
export type RehypeFigurePlugin = unified.Pluggable & {
  [rehypeFigurePluginBrand]: unknown;
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
      code,
      ...footnoteHandlers,
    } as const,
    hastPlugins: [
      brand<RehypeRawPlugin>(raw),
      brand<RehypeFigurePlugin>(partial(figure, options)),
      brand<RehypeFootnotePlugin>(footnoteTransformer),
      brand<RehypeReplacePlugin>(partial(replace, options)),
      brand<RehypeDocumentPlugin>(partial(doc, options)),
      // Must be run after `rehype-document` to write to `<head>`
      brand<RehypeMathPlugin>(partial(math, options)),
      // Explicitly specify true if want unformatted HTML during development or debug
      brand<RehypeFormatPlugin>(format(options)),
    ] as const,
  };
};
