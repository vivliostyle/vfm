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
 *
 * Inside an image label the node is dropped. The label only serves as the
 * image's `alt`, which `mdast-util-to-string` builds from the label's nodes:
 * a `footnote` would add the note text to it (`![a^[note]](i.png)` gave
 * `alt="anote"`). A GFM `footnoteReference` has no text and leaves `alt`
 * alone, so dropping the note makes both kinds of footnote behave the same.
 * @param token - The `footnoteInline` token.
 */
function exitFootnote(this: CompileContext, token: Token): undefined {
  const node = this.stack[this.stack.length - 1];
  this.exit(token);
  if (!node || !this.stack.some((ancestor) => ancestor.type === 'image')) {
    return;
  }

  const parent = this.stack[this.stack.length - 1];
  if (parent && 'children' in parent) {
    const children = parent.children as unknown[];
    const index = children.lastIndexOf(node);
    if (index !== -1) {
      children.splice(index, 1);
    }
  }
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
