import type * as unified from 'unified';
import type * as fromMarkdown from 'mdast-util-from-markdown';
import type * as micromark from 'micromark-util-types';

import { attributeFromMarkdown, type Options } from './mdast-util.ts';
import { attribute } from './micromark-extension.ts';

/**
 * Add support for attributes (`{#id .class key=value}`).
 *
 * @param options
 *   Configuration (optional).
 * @returns
 *   Nothing.
 */
export function remarkAttribute(
  this: unified.Processor,
  options?: Options | null | undefined,
) {
  const data = this.data() as {
    micromarkExtensions?: micromark.Extension[] | undefined;
    fromMarkdownExtensions?: fromMarkdown.Extension[] | undefined;
  };
  (data.micromarkExtensions ?? (data.micromarkExtensions = [])).push(
    attribute(),
  );
  (data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = [])).push(
    attributeFromMarkdown(options),
  );
}
