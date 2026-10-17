import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';
import type { Handler } from 'mdast-util-to-hast';
import type { Extension as MicromarkExtension } from 'micromark-util-types';
import type { Plugin } from 'unified';
import { u } from 'unist-builder';
import { rubyFromMarkdown, type Ruby } from './mdast-util.js';
import { ruby as rubySyntax } from './micromark-extension.js';

export type { Ruby, RubyData } from './mdast-util.js';
export { rubyFromMarkdown } from './mdast-util.js';
export { ruby as rubySyntax } from './micromark-extension.js';

/**
 * Whether `node` is a `ruby` node produced by {@link rubyFromMarkdown}.
 * @param node - Any value handed to the to-hast handler.
 * @returns `true` for a `ruby` node.
 */
const isRuby = (node: unknown): node is Ruby =>
  !!node &&
  typeof node === 'object' &&
  (node as { type?: unknown }).type === 'ruby' &&
  typeof (node as { rubyText?: unknown }).rubyText === 'string';

/**
 * remark plugin: parse `{base|ruby}` into `ruby` nodes by registering the
 * micromark and `mdast-util-from-markdown` extensions on the processor.
 */
export const mdast: Plugin = function () {
  const data = this.data() as {
    micromarkExtensions?: MicromarkExtension[] | undefined;
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined;
  };
  (data.micromarkExtensions ??= []).push(rubySyntax());
  (data.fromMarkdownExtensions ??= []).push(rubyFromMarkdown());
};

/**
 * mdast-util-to-hast handler: `ruby` node to `<ruby>base<rt>ruby</rt></ruby>`.
 * @param state - to-hast state.
 * @param node - Node to handle; anything but a `ruby` node is left to the
 *   default handling.
 * @returns The `<ruby>` element, or `undefined` for other nodes.
 */
export const handler: Handler = (state, node) => {
  if (!isRuby(node)) return undefined;
  const rt = u('element', { tagName: 'rt', properties: {} }, [
    u('text', node.rubyText),
  ]);
  const ruby = u('element', { tagName: 'ruby', properties: {} }, [
    ...state.all(node),
    rt,
  ]);
  state.patch(node, ruby);
  return state.applyData(node, ruby);
};
