import frontmatter from 'remark-frontmatter';
import markdown from 'remark-parse';
import unified from 'unified';
import { mdast as attr } from './plugins/attr.js';
import { mdast as code } from './plugins/code.js';
import { mdast as footnotes } from './plugins/footnotes.js';
import {
  mdast as lineBreaks,
  type LineBreaksOptions,
} from './plugins/line-breaks.js';
import { mdast as math, type MathOptions } from './plugins/math.js';
import { mdast as ruby } from './plugins/ruby.js';
import { mdast as section } from './plugins/section.js';
import { mdast as slug } from './plugins/slug.js';
import { mdast as toc } from './plugins/toc.js';
import { inspect } from './utils.js';

export type ReviveParseOptions = LineBreaksOptions & MathOptions;

/**
 * Create Markdown AST parsers.
 * @param options Options for mdast parsers.
 * @returns Parsers.
 */
export const reviveParse = (options: ReviveParseOptions) =>
  [
    [markdown, { gfm: true, commonmark: true }],
    [lineBreaks, options],
    [math, options],
    ruby,
    footnotes,
    attr,
    slug,
    section,
    code,
    toc,
    frontmatter,
    inspect('mdast'),
  ] as unified.PluggableList<unified.Settings>;
