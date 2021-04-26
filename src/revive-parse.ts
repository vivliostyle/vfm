import breaks from 'remark-breaks';
import footnotes from 'remark-footnotes';
import frontmatter from 'remark-frontmatter';
import markdown from 'remark-parse';
import slug from 'remark-slug';
import unified from 'unified';
import { mdast as attr } from './plugins/attr';
import { mdast as code } from './plugins/code';
import { mdast as math } from './plugins/math';
import { mdast as metadata } from './plugins/metadata';
import { mdast as ruby } from './plugins/ruby';
import { mdast as section } from './plugins/section';
import { mdast as toc } from './plugins/toc';
import { inspect } from './utils';

/**
 * Create Markdown AST parsers.
 * @param hardLineBreaks Add `<br>` at the position of hard line breaks, without needing spaces..
 * @param enableMath Enable math syntax.
 * @returns Parsers.
 */
export const reviveParse = (
  hardLineBreaks: boolean,
  enableMath: boolean,
): unified.PluggableList<unified.Settings> => [
  [markdown, { gfm: true, commonmark: true }],
  ...(hardLineBreaks ? [breaks] : []),
  ...(enableMath ? [math] : []),
  ruby,
  [footnotes, { inlineNotes: true }],
  attr,
  slug,
  section,
  code,
  toc,
  frontmatter,
  metadata,
  inspect('mdast'),
];
