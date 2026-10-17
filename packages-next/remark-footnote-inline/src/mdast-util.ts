import type { Data, Parent, PhrasingContent } from 'mdast';
import type {
  CompileContext,
  Extension,
  Token,
} from 'mdast-util-from-markdown';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an interface so consumers can augment it like the other mdast `*Data` types.
export interface FootnoteData extends Data {}

/**
 * Inline footnote (`^[...]`). The node type and shape follow remark-footnotes
 * 2, which the VFM footnote handlers were written against.
 */
export interface Footnote extends Parent {
  type: 'footnote';
  children: PhrasingContent[];
  data?: FootnoteData | undefined;
}

declare module 'mdast' {
  interface PhrasingContentMap {
    footnote: Footnote;
  }
  interface RootContentMap {
    footnote: Footnote;
  }
}

/**
 * Enter a `footnote` node; the note text becomes its children.
 * @param token - The `footnoteInline` token.
 */
function enterFootnote(this: CompileContext, token: Token): undefined {
  this.enter({ type: 'footnote', children: [] }, token);
}

/**
 * Exit the `footnote` node.
 * @param token - The `footnoteInline` token.
 */
function exitFootnote(this: CompileContext, token: Token): undefined {
  this.exit(token);
}

/**
 * Create the `mdast-util-from-markdown` extension that turns the
 * `footnoteInline` tokens of the micromark extension into `footnote` nodes.
 * @returns Extension to register on a remark processor
 *   (`fromMarkdownExtensions`).
 */
export const footnoteInlineFromMarkdown = (): Extension => ({
  // Keep line endings inside a note that spans lines.
  canContainEols: ['footnote'],
  enter: { footnoteInline: enterFootnote },
  exit: { footnoteInline: exitFootnote },
});
