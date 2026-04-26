import frontmatter from 'remark-frontmatter';
import type unified from 'unified';
import { mdast as attr } from './plugins/attr.js';
import { mdast as code } from './plugins/code.js';
import { mdast as footnote } from './plugins/footnotes.js';
import {
  mdast as lineBreaks,
  type LineBreaksOptions,
} from './plugins/line-breaks.js';
import { mdast as math, type MathOptions } from './plugins/math.js';
import { mdast as ruby } from './plugins/ruby.js';
import { mdast as section } from './plugins/section.js';
import { mdast as slug } from './plugins/slug.js';
import { mdast as toc } from './plugins/toc.js';
import { brand, partial } from './utils.js';

export type ReviveParseOptions = LineBreaksOptions & MathOptions;

declare const remarkLineBreaksPluginBrand: unique symbol;
export type RemarkLineBreaksPlugin = unified.Pluggable & {
  [remarkLineBreaksPluginBrand]: unknown;
};

declare const remarkMathPluginBrand: unique symbol;
export type RemarkMathPlugin = unified.Pluggable & {
  [remarkMathPluginBrand]: unknown;
};

declare const remarkRubyPluginBrand: unique symbol;
export type RemarkRubyPlugin = unified.Pluggable & {
  [remarkRubyPluginBrand]: unknown;
};

declare const remarkFootnotePluginBrand: unique symbol;
export type RemarkFootnotesPlugin = unified.Pluggable & {
  [remarkFootnotePluginBrand]: unknown;
};

declare const remarkAttrPluginBrand: unique symbol;
export type RemarkAttrPlugin = unified.Pluggable & {
  [remarkAttrPluginBrand]: unknown;
};

declare const remarkSlugPluginBrand: unique symbol;
export type RemarkSlugPlugin = unified.Pluggable & {
  [remarkSlugPluginBrand]: unknown;
};

declare const remarkSectionPluginBrand: unique symbol;
export type RemarkSectionPlugin = unified.Pluggable & {
  [remarkSectionPluginBrand]: unknown;
};

declare const remarkCodePluginBrand: unique symbol;
export type RemarkCodePlugin = unified.Pluggable & {
  [remarkCodePluginBrand]: unknown;
};

declare const remarkTocPluginBrand: unique symbol;
export type RemarkTocPlugin = unified.Pluggable & {
  [remarkTocPluginBrand]: unknown;
};

declare const remarkFrontmatterPluginBrand: unique symbol;
export type RemarkFrontmatterPlugin = unified.Pluggable & {
  [remarkFrontmatterPluginBrand]: unknown;
};

/**
 * Create Markdown AST parsers.
 * @param options Options for mdast parsers.
 * @returns Parsers.
 */
export const reviveParse = (options: ReviveParseOptions) => ({
  mdastPlugins: [
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
