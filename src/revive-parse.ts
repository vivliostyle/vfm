import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import type { PluggableList } from 'unified';
import { mdast as attr } from './plugins/attr.js';
import { mdast as code } from './plugins/code.js';
import { mdast as footnotes } from './plugins/footnotes.js';
import { mdast as math } from './plugins/math.js';
import { mdast as ruby } from './plugins/ruby.js';
import { mdast as section } from './plugins/section.js';
import { mdast as slug } from './plugins/slug.js';
import { mdast as toc } from './plugins/toc.js';
import { inspect } from './utils.js';

/**
 * Create Markdown AST parsers.
 * @param hardLineBreaks Add `<br>` at the position of hard line breaks, without needing spaces.
 * @param enableMath Enable math syntax.
 * @returns Parsers.
 */
export const reviveParse = (
  hardLineBreaks: boolean,
  enableMath: boolean,
): PluggableList => [
  remarkParse,
  remarkGfm,
  ...(hardLineBreaks ? [remarkBreaks] : []),
  ...(enableMath ? [math] : []),
  ruby,
  footnotes,
  attr,
  slug,
  section,
  code,
  toc,
  remarkFrontmatter,
  inspect('mdast'),
];
