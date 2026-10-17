import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';
import type { Extension as MicromarkExtension } from 'micromark-util-types';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { remove } from 'unist-util-remove';
import { mergePlugins } from '../utils.js';
import { shortcodeFromMarkdown, type Shortcode } from './toc-mdast.js';
import { shortcodeSyntax } from './toc-syntax.js';

export type { Shortcode, ShortcodeData } from './toc-mdast.js';
export {
  parseShortcodeAttributes,
  shortcodeFromMarkdown,
} from './toc-mdast.js';
export { shortcodeSyntax } from './toc-syntax.js';

/**
 * remark plugin: parse `[[name ...]]` lines into `shortcode` nodes by
 * registering the VFM shortcode syntax on the processor.
 */
const shortcodes: Plugin<[]> = function () {
  const data = this.data() as {
    micromarkExtensions?: MicromarkExtension[] | undefined;
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined;
  };
  (data.micromarkExtensions ??= []).push(shortcodeSyntax());
  (data.fromMarkdownExtensions ??= []).push(shortcodeFromMarkdown());
};

/**
 * remark plugin: remove every shortcode except `[[toc]]`. The `toc` node is
 * kept and renders as an empty `<div>` (the default for unknown nodes); its
 * future is decided in #207.
 * @returns Transformer.
 */
const keepToC = () => (tree: Node) => {
  remove(
    tree,
    { cascade: false },
    (node: Node) =>
      node.type === 'shortcode' && (node as Shortcode).identifier !== 'toc',
  );
};

export const mdast = mergePlugins(shortcodes, keepToC);
