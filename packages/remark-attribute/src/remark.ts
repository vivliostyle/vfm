import type * as unified from 'unified';
import { attributeFromMarkdown, type Options } from './mdast-util.ts';
import { attribute } from './micromark-extension/index.ts';

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
  const data = this.data() as Record<string, unknown>;

  const micromarkExtensions =
    (data.micromarkExtensions as unknown[]) ||
    (data.micromarkExtensions = [] as unknown[]);
  const fromMarkdownExtensions =
    (data.fromMarkdownExtensions as unknown[]) ||
    (data.fromMarkdownExtensions = [] as unknown[]);

  micromarkExtensions.push(attribute());
  fromMarkdownExtensions.push(attributeFromMarkdown(options));
}
