import breaks from 'remark-breaks';
import footnotes from 'remark-footnotes';
import frontmatter from 'remark-frontmatter';
import math from 'remark-math';
import markdown from 'remark-parse';
import slug from 'remark-slug';
import unified from 'unified';
import { mdast as attr } from './plugins/attr';
import { mdast as code } from './plugins/code';
import { mdast as metadata } from './plugins/metadata';
import { mdast as ruby } from './plugins/ruby';
import { mdast as section } from './plugins/section';
import { mdast as toc } from './plugins/toc';
import { inspect } from './utils';

/**
 * Options for Markdown conversion.
 */
export interface MarkdownOptions {
  /** Add `<br>` at the position of hard line breaks, without needing spaces. */
  hardLineBreaks: boolean;
}

/**
 * Create MDAST parsers.
 * @param options Options.
 * @returns Parsers.
 */
export const reviveParse = (
  options: MarkdownOptions,
): unified.PluggableList<unified.Settings> => [
  [markdown, { gfm: true, commonmark: true }],
  ruby,
  ...(options.hardLineBreaks ? [breaks] : []),
  [footnotes, { inlineNotes: true }],
  math,
  attr,
  slug,
  section,
  code,
  toc,
  frontmatter,
  metadata,
  inspect('mdast'),
];
