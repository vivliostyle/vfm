import type { Data, Node } from 'mdast';
import type {
  CompileContext,
  Extension,
  Token,
} from 'mdast-util-from-markdown';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an interface so consumers can augment it like the other mdast `*Data` types.
export interface ShortcodeData extends Data {}

/**
 * Block-level shortcode node, `[[identifier key="value" ...]]`. Same shape as
 * the node that `remark-shortcodes` emitted.
 * @see https://github.com/djm/remark-shortcodes#example
 */
export interface Shortcode extends Node {
  type: 'shortcode';
  /** Name of the shortcode, e.g. `toc` for `[[toc]]`. */
  identifier: string;
  /** `key="value"` pairs that follow the identifier; `{}` when there are none. */
  attributes: Record<string, string>;
  data?: ShortcodeData | undefined;
}

declare module 'mdast' {
  interface BlockContentMap {
    shortcode: Shortcode;
  }
  interface RootContentMap {
    shortcode: Shortcode;
  }
}

/**
 * Parse the attribute string of a shortcode into key/value pairs.
 *
 * Accepts `key="value"`, `key='value'` and `key=value` separated by
 * whitespace, the same grammar as `remark-shortcodes`. Unlike that package
 * the surrounding single quotes are removed too, and a pair without a key
 * (`="value"`) is ignored. Anything that does not match is skipped.
 * @param value - Text between the identifier and the closing `]]`.
 * @returns Attributes keyed by name.
 */
export const parseShortcodeAttributes = (
  value: string,
): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const pairs = value.trim().match(/[\w-]*=\s*(?:"[^"]*"|'[^']*'|[^}\s]+)/g);
  if (!pairs) {
    return attributes;
  }
  for (const pair of pairs) {
    const index = pair.indexOf('=');
    const key = pair.slice(0, index).trim();
    if (!key) {
      continue;
    }
    attributes[key] = pair
      .slice(index + 1)
      .trim()
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1');
  }
  return attributes;
};

/**
 * Enter a `shortcode` node.
 * @param token - The `shortcode` token.
 */
function enterShortcode(this: CompileContext, token: Token): undefined {
  this.enter({ type: 'shortcode', identifier: '', attributes: {} }, token);
}

/**
 * Store the identifier on the open `shortcode` node.
 * @param token - The `shortcodeIdentifier` token.
 */
function exitIdentifier(this: CompileContext, token: Token): undefined {
  const node = this.stack[this.stack.length - 1];
  if (node?.type === 'shortcode') {
    node.identifier = this.sliceSerialize(token);
  }
}

/**
 * Parse the attribute string and store it on the open `shortcode` node.
 * @param token - The `shortcodeAttributes` token.
 */
function exitAttributes(this: CompileContext, token: Token): undefined {
  const node = this.stack[this.stack.length - 1];
  if (node?.type === 'shortcode') {
    node.attributes = parseShortcodeAttributes(this.sliceSerialize(token));
  }
}

/**
 * Close the `shortcode` node.
 * @param token - The `shortcode` token.
 */
function exitShortcode(this: CompileContext, token: Token): undefined {
  this.exit(token);
}

/**
 * Create the `mdast-util-from-markdown` extension that turns the tokens of
 * the VFM shortcode syntax into `shortcode` nodes.
 * @returns Extension to register on a remark processor
 *   (`fromMarkdownExtensions`).
 */
export const shortcodeFromMarkdown = (): Extension => ({
  enter: { shortcode: enterShortcode },
  exit: {
    shortcode: exitShortcode,
    shortcodeIdentifier: exitIdentifier,
    shortcodeAttributes: exitAttributes,
  },
});
