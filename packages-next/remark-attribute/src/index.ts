import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';
import type { Extension as MicromarkExtension } from 'micromark-util-types';
import type { Plugin } from 'unified';
import { attributeFromMarkdown, type Options } from './mdast-util.js';
import { attributeSyntax } from './micromark-extension.js';

export type {
  AttributeBlock,
  AttributeInline,
  Options,
  Scope,
} from './mdast-util.js';
export { attributeFromMarkdown } from './mdast-util.js';
export { attributeSyntax } from './micromark-extension.js';

/**
 * remark plugin: parse `{#id .class key=value}` attribute lists and attach
 * them to the node they follow as `data.hProperties`.
 * @param options - Options.
 */
export const mdast: Plugin<[(Options | null | undefined)?]> = function (
  options,
) {
  const data = this.data() as {
    micromarkExtensions?: MicromarkExtension[] | undefined;
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined;
  };
  (data.micromarkExtensions ??= []).push(attributeSyntax());
  (data.fromMarkdownExtensions ??= []).push(attributeFromMarkdown(options));
};
