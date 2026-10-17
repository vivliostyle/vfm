import frontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import type { Pluggable } from 'unified';
import { mdast as attr } from './plugins/attr.js';
import { mdast as code } from './plugins/code.js';
import {
  mdast as parseImageAltAsInline,
  type FigcaptionInlineOptions,
} from './plugins/figure.js';
import { mdast as footnote } from './plugins/footnotes.js';
import {
  mdast as lineBreaks,
  type LineBreaksOptions,
} from './plugins/line-breaks.js';
import { mdast as math, type MathOptions } from './plugins/math.js';
import { mdast as ruby } from '@vivliostyle/remark-ruby-next';
import { mdast as section } from '@vivliostyle/remark-sectionize-next';
import { mdast as slug } from './plugins/slug.js';
import { mdast as toc } from './plugins/toc.js';
import { brand, partial } from './utils.js';

export type ReviveParseOptions = FigcaptionInlineOptions &
  LineBreaksOptions &
  MathOptions;

declare const remarkGfmPluginBrand: unique symbol;
export type RemarkGfmPlugin = Pluggable & {
  [remarkGfmPluginBrand]: unknown;
};

declare const remarkParseImageAltAsInlinePluginBrand: unique symbol;
export type RemarkParseImageAltAsInlinePlugin = Pluggable & {
  [remarkParseImageAltAsInlinePluginBrand]: unknown;
};

declare const remarkLineBreaksPluginBrand: unique symbol;
export type RemarkLineBreaksPlugin = Pluggable & {
  [remarkLineBreaksPluginBrand]: unknown;
};

declare const remarkMathPluginBrand: unique symbol;
export type RemarkMathPlugin = Pluggable & {
  [remarkMathPluginBrand]: unknown;
};

declare const remarkRubyPluginBrand: unique symbol;
export type RemarkRubyPlugin = Pluggable & {
  [remarkRubyPluginBrand]: unknown;
};

declare const remarkFootnotePluginBrand: unique symbol;
export type RemarkFootnotesPlugin = Pluggable & {
  [remarkFootnotePluginBrand]: unknown;
};

declare const remarkAttrPluginBrand: unique symbol;
export type RemarkAttrPlugin = Pluggable & {
  [remarkAttrPluginBrand]: unknown;
};

declare const remarkSlugPluginBrand: unique symbol;
export type RemarkSlugPlugin = Pluggable & {
  [remarkSlugPluginBrand]: unknown;
};

declare const remarkSectionPluginBrand: unique symbol;
export type RemarkSectionPlugin = Pluggable & {
  [remarkSectionPluginBrand]: unknown;
};

declare const remarkCodePluginBrand: unique symbol;
export type RemarkCodePlugin = Pluggable & {
  [remarkCodePluginBrand]: unknown;
};

declare const remarkTocPluginBrand: unique symbol;
export type RemarkTocPlugin = Pluggable & {
  [remarkTocPluginBrand]: unknown;
};

declare const remarkFrontmatterPluginBrand: unique symbol;
export type RemarkFrontmatterPlugin = Pluggable & {
  [remarkFrontmatterPluginBrand]: unknown;
};

/**
 * Create Markdown AST parsers.
 * @param options - Options for mdast parsers.
 * @returns Parsers.
 */
export const reviveParse = (options: ReviveParseOptions) => ({
  mdastPlugins: [
    // GFM (table, strikethrough, autolink literal, footnote reference and
    // definition). Replaces remark-parse 8's `{ gfm: true }` option.
    brand<RemarkGfmPlugin>(remarkGfm),
    brand<RemarkParseImageAltAsInlinePlugin>(
      partial(parseImageAltAsInline, options),
    ),
    brand<RemarkLineBreaksPlugin>(lineBreaks(options)),
    brand<RemarkMathPlugin>(partial(math, options)),
    brand<RemarkRubyPlugin>(ruby),
    brand<RemarkFootnotesPlugin>(footnote),
    brand<RemarkAttrPlugin>(attr),
    brand<RemarkSlugPlugin>(slug),
    brand<RemarkSectionPlugin>(section),
    brand<RemarkCodePlugin>(code),
    brand<RemarkTocPlugin>(toc),
    brand<RemarkFrontmatterPlugin>(frontmatter),
  ] as const,
});
