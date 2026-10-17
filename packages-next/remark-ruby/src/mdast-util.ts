import type { Data, Parent, PhrasingContent } from 'mdast';
import type {
  CompileContext,
  Extension,
  Token,
} from 'mdast-util-from-markdown';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an interface so consumers can augment it like the other mdast `*Data` types.
export interface RubyData extends Data {}

/** Ruby annotation (`{base|ruby}`). */
export interface Ruby extends Parent {
  type: 'ruby';
  /** Text of the `<rt>` element. */
  rubyText: string;
  children: PhrasingContent[];
  data?: RubyData | undefined;
}

declare module 'mdast' {
  interface PhrasingContentMap {
    ruby: Ruby;
  }
  interface RootContentMap {
    ruby: Ruby;
  }
}

/**
 * Enter a `ruby` node. `rubyText` is filled in by {@link exitRubyText}.
 * @param token - The `ruby` token.
 */
function enterRuby(this: CompileContext, token: Token): undefined {
  this.enter({ type: 'ruby', rubyText: '', children: [] }, token);
}

/**
 * Store the literal ruby text on the `ruby` node being built.
 * @param token - The `rubyText` token.
 */
function exitRubyText(this: CompileContext, token: Token): undefined {
  const node = this.stack[this.stack.length - 1];
  if (node && node.type === 'ruby') {
    node.rubyText = this.sliceSerialize(token);
  }
}

/**
 * Exit the `ruby` node.
 * @param token - The `ruby` token.
 */
function exitRuby(this: CompileContext, token: Token): undefined {
  this.exit(token);
}

/**
 * Create an `mdast-util-from-markdown` extension that turns the `ruby`
 * tokens of the micromark extension into `ruby` nodes.
 * @returns Extension to pass to `fromMarkdown` (`mdastExtensions`) or to
 *   register on a remark processor (`fromMarkdownExtensions`).
 */
export const rubyFromMarkdown = (): Extension => ({
  enter: { ruby: enterRuby },
  exit: { ruby: exitRuby, rubyText: exitRubyText },
});
