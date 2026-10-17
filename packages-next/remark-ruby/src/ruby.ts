import type { Data, Parent, PhrasingContent } from 'mdast';
// Registers `hName` on mdast `Data`.
import type { Handler } from 'mdast-util-to-hast';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { u } from 'unist-builder';

export interface RubyData extends Data {
  hName: 'ruby';
  /** Text of the `<rt>` element. */
  rubyText: string;
}

/** Ruby annotation (`{base|ruby}`). */
export interface Ruby extends Parent {
  type: 'ruby';
  children: PhrasingContent[];
  data: RubyData;
}

declare module 'mdast' {
  interface PhrasingContentMap {
    ruby: Ruby;
  }
  interface RootContentMap {
    ruby: Ruby;
  }
}

const isRuby = (node: unknown): node is Ruby =>
  !!node &&
  typeof node === 'object' &&
  (node as { type?: unknown }).type === 'ruby' &&
  typeof (node as { data?: { rubyText?: unknown } }).data?.rubyText ===
    'string';

// ---------------------------------------------------------------------------
// remark-parse 8 tokenizer
//
// remark-parse 11 exposes `this.parser` (a `mdast-util-from-markdown`
// wrapper) instead of `this.Parser`, so the registration below never runs
// there and `{base|ruby}` is left as plain text. The tokenizer is kept only
// until it is replaced by a micromark extension.
// @todo Rewrite as a micromark + mdast-util-from-markdown extension (#286).
// ---------------------------------------------------------------------------

type Point = { line: number; column: number; offset: number };

type Eat = ((subvalue: string) => <N extends Node>(node: N) => N) & {
  now(): Point;
};

type TokenizerInstance = {
  tokenizeInline(value: string, location: Point): Node[];
};

interface Tokenizer {
  (
    this: TokenizerInstance,
    eat: Eat,
    value: string,
    silent?: boolean,
  ): boolean | Node | void;
  locator?: (value: string, fromIndex: number) => number;
}

type LegacyParser = {
  prototype: {
    inlineTokenizers: Record<string, Tokenizer>;
    inlineMethods: string[];
  };
};

const tokenizer: Tokenizer = function (eat, value, silent) {
  const now = eat.now();
  const match = /^{(.+?)(?<=[^\\|])\|(.+?)}/.exec(value);
  if (!match) return;

  // The regex has exactly 2 capture groups
  const eaten = match[0]!;
  const inlineContent = match[1]!;
  const rubyText = match[2]!;

  if (silent) return true;

  now.column += 1;
  now.offset += 1;

  const children = this.tokenizeInline(inlineContent, now) as PhrasingContent[];
  return eat(eaten)({
    type: 'ruby',
    children,
    data: { hName: 'ruby', rubyText },
  } satisfies Ruby);
};

tokenizer.locator = (value, fromIndex) => value.indexOf('{', fromIndex);

// remark
export const mdast: Plugin = function () {
  const parser = (this as unknown as { Parser?: LegacyParser }).Parser;
  if (!parser) return;

  const { inlineTokenizers, inlineMethods } = parser.prototype;
  inlineTokenizers.ruby = tokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};

// rehype
export const handler: Handler = (state, node) => {
  if (!isRuby(node)) return undefined;
  const rt = u('element', { tagName: 'rt', properties: {} }, [
    u('text', node.data.rubyText),
  ]);
  const ruby = u('element', { tagName: 'ruby', properties: {} }, [
    ...state.all(node),
    rt,
  ]);
  state.patch(node, ruby);
  return state.applyData(node, ruby);
};
