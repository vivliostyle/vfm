import type { Data, Literal, Nodes } from 'mdast';
import type {
  CompileContext,
  Extension,
  Token,
} from 'mdast-util-from-markdown';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an interface so consumers can augment it like the other mdast `*Data` types.
export interface InlineMathData extends Data {}

/** Inline math `$...$`. Same shape as the `inlineMath` node of remark-math. */
export interface InlineMath extends Literal {
  type: 'inlineMath';
  data?: InlineMathData | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an interface so consumers can augment it like the other mdast `*Data` types.
export interface DisplayMathData extends Data {}

/**
 * Display math `$$...$$`. VFM specific: remark-math has no inline-level
 * display node, its `math` node is a flow (block) construct.
 */
export interface DisplayMath extends Literal {
  type: 'displayMath';
  data?: DisplayMathData | undefined;
}

declare module 'mdast' {
  interface PhrasingContentMap {
    inlineMath: InlineMath;
    displayMath: DisplayMath;
  }
  interface RootContentMap {
    inlineMath: InlineMath;
    displayMath: DisplayMath;
  }
}

/**
 * Enter an `inlineMath` node and start buffering its value.
 * @param token - The `mathInline` token.
 */
function enterInline(this: CompileContext, token: Token): undefined {
  this.enter({ type: 'inlineMath', value: '' }, token);
  this.buffer();
}

/**
 * Enter a `displayMath` node and start buffering its value.
 * @param token - The `mathDisplay` token.
 */
function enterDisplay(this: CompileContext, token: Token): undefined {
  this.enter({ type: 'displayMath', value: '' }, token);
  this.buffer();
}

/**
 * Append a value chunk to the buffer. Line endings between chunks are
 * appended by `mdast-util-from-markdown` itself because the buffer is a
 * `fragment`.
 * @param token - A `mathInlineValue` or `mathDisplayValue` token.
 */
function exitValue(this: CompileContext, token: Token): undefined {
  const enterData = this.config.enter.data;
  const exitData = this.config.exit.data;
  if (enterData && exitData) {
    enterData.call(this, token);
    exitData.call(this, token);
  }
}

/**
 * Take the buffered value and close the node.
 *
 * Inside an image label the math is put back as literal text. The label
 * becomes the image's `alt` through `mdast-util-to-string`, which would drop
 * the `$` delimiters; keeping them matches the remark-parse 8 output
 * (`notInLink`), where `alt` and the default figcaption show the source text.
 * The figcaption re-parse of `parseFigcaptionAsInline` reads the label from
 * the Markdown source, so it does not depend on this. Whether `alt` should
 * instead hold the plain math is a Phase 4 decision (#293).
 * @param token - The `mathInline` or `mathDisplay` token.
 */
function exitMath(this: CompileContext, token: Token): undefined {
  const value = this.resume();
  const node = this.stack[this.stack.length - 1];
  this.exit(token);
  if (!node || (node.type !== 'inlineMath' && node.type !== 'displayMath')) {
    return;
  }
  node.value = value;

  if (this.stack.some((ancestor) => ancestor.type === 'image')) {
    const parent = this.stack[this.stack.length - 1];
    if (parent && 'children' in parent) {
      const children = parent.children as Nodes[];
      const index = children.lastIndexOf(node);
      if (index !== -1) {
        children[index] = {
          type: 'text',
          value: this.sliceSerialize(token),
          position: node.position,
        };
      }
    }
  }
}

/**
 * Create the `mdast-util-from-markdown` extension that turns the tokens of
 * the VFM math syntax into `inlineMath` / `displayMath` nodes.
 * @returns Extension to register on a remark processor
 *   (`fromMarkdownExtensions`).
 */
export const mathFromMarkdown = (): Extension => ({
  enter: { mathInline: enterInline, mathDisplay: enterDisplay },
  exit: {
    mathInline: exitMath,
    mathDisplay: exitMath,
    mathInlineValue: exitValue,
    mathDisplayValue: exitValue,
  },
});
