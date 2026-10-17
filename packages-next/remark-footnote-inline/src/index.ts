import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';
import type { Extension as MicromarkExtension } from 'micromark-util-types';
import type { Plugin } from 'unified';
import { footnoteInlineFromMarkdown } from './mdast-util.js';
import { footnoteInlineSyntax } from './micromark-extension.js';

export type { Footnote, FootnoteData } from './mdast-util.js';
export { footnoteInlineFromMarkdown } from './mdast-util.js';
export { footnoteInlineSyntax } from './micromark-extension.js';

/**
 * remark plugin: parse `^[...]` into `footnote` nodes. Footnote references
 * and definitions (`[^id]`) are left to remark-gfm.
 */
export const mdast: Plugin = function () {
  const data = this.data() as {
    micromarkExtensions?: MicromarkExtension[] | undefined;
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined;
  };
  (data.micromarkExtensions ??= []).push(footnoteInlineSyntax());
  (data.fromMarkdownExtensions ??= []).push(footnoteInlineFromMarkdown());
};
