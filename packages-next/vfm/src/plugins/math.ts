import type { Element, ElementContent, Root as HastRoot } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { select } from 'hast-util-select';
import type { Data, Node as MdastNode, Root as MdastRoot } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Handler } from 'mdast-util-to-hast';
import temml from 'temml';
import type { Plugin, Transformer } from 'unified';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';

export interface InlineMathData extends Data {
  hName: 'inlineMath';
  value: string;
}

export interface InlineMath extends MdastNode {
  type: 'inlineMath';
  data: InlineMathData;
}

export interface DisplayMathData extends Data {
  hName: 'displayMath';
  value: string;
}

export interface DisplayMath extends MdastNode {
  type: 'displayMath';
  data: DisplayMathData;
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
 * Inline math format, e.g. `$...$`.
 * - OK: `$x = y$`, `$x = \$y$`
 * - NG: `$$x = y$`, `$x = y$$`, `$ x = y$`, `$x = y $`, `$x = y$7`
 */
const REGEXP_INLINE = /\$([^$\s].*?(?<=[^\\$\s]|[^\\](?:\\\\)+))\$(?!\$|\d)/gs;

/** Display math format, e.g. `$$...$$`. */
const REGEXP_DISPLAY = /\$\$([^$].*?(?<=[^$]))\$\$(?!\$)/gs;

/** Type of inline math in Markdown AST. */
const TYPE_INLINE = 'inlineMath';

/** Type of display math in Markdown AST. */
const TYPE_DISPLAY = 'displayMath';

/** URL of MathJax v2 supported by Vivliostyle. */
const MATH_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';

/**
 * Renderer used to turn LaTeX math into HTML, applied only when `math` is
 * enabled.
 * - `'mathjax'`: legacy output (raw LaTeX + a MathJax `<script>`), rendered in
 *   the browser at runtime.
 * - `'mathml'`: LaTeX converted to MathML at build time via temml. This is the
 *   opt-in migration path toward VFM's future math behavior (see #224).
 */
export const MathRendererSchema = v.union([
  v.literal('mathjax'),
  v.literal('mathml'),
]);

export type MathRenderer = v.InferInput<typeof MathRendererSchema>;

export const MathOptionsSchema = v.object({
  math: v.optional(v.pipe(v.boolean(), v.description('Enable math syntax.'))),
  mathRenderer: v.optional(
    v.pipe(
      MathRendererSchema,
      v.description(
        "Renderer used when `math` is enabled. `'mathjax'` (default): keep the LaTeX source and load MathJax for runtime rendering. `'mathml'`: convert LaTeX to MathML at build time via temml, with no runtime script.",
      ),
    ),
  ),
});

export type MathOptions = v.InferInput<typeof MathOptionsSchema>;

/**
 * Create tokenizers for remark-parse.
 * @returns Tokenizers.
 */
const createTokenizers = () => {
  const tokenizerInlineMath: Tokenizer = function (eat, value, silent) {
    if (
      !value.startsWith('$') ||
      value.startsWith('$ ') ||
      value.startsWith('$$')
    ) {
      return;
    }

    const match = new RegExp(REGEXP_INLINE).exec(value);
    if (!match) {
      return;
    }

    if (silent) {
      return true;
    }

    const [eaten, valueText] = match;
    const now = eat.now();
    now.column += 1;
    now.offset += 1;

    return eat(eaten)({
      type: TYPE_INLINE,
      data: { hName: TYPE_INLINE, value: valueText },
    });
  };

  tokenizerInlineMath.notInLink = true;
  tokenizerInlineMath.locator = function (value: string, fromIndex: number) {
    return value.indexOf('$', fromIndex);
  };

  const tokenizerDisplayMath: Tokenizer = function (eat, value, silent) {
    if (!value.startsWith('$$') || value.startsWith('$$$')) {
      return;
    }

    const match = new RegExp(REGEXP_DISPLAY).exec(value);
    if (!match) {
      return;
    }

    if (silent) {
      return true;
    }

    const [eaten, valueText] = match;
    const now = eat.now();
    now.column += 1;
    now.offset += 1;

    return eat(eaten)({
      type: TYPE_DISPLAY,
      data: { hName: TYPE_DISPLAY, value: valueText },
    });
  };

  tokenizerDisplayMath.notInLink = true;
  tokenizerDisplayMath.locator = function (value: string, fromIndex: number) {
    return value.indexOf('$$', fromIndex);
  };

  return { tokenizerInlineMath, tokenizerDisplayMath };
};

/**
 * Process Markdown AST.
 *
 * remark-parse 8 ran the tokenizers above. remark-parse 11 has no parser
 * class to patch, so the `findAndReplace` fallback below is what runs there.
 * It works on `text` nodes after parsing and is not equivalent: inline
 * markup inside `$...$` is already parsed, and `$` inside code is matched.
 * TODO(#287): replace both paths with a micromark extension (remark-math 6 is
 * the candidate) and delete the fallback.
 * @returns Transformer or undefined (remark-parse 8).
 */
export const mdast: Plugin<[MathOptions?], MdastRoot> = function ({
  math = true,
}: MathOptions = {}): Transformer<MdastRoot> | undefined {
  if (!math) return;

  const parser = (this as unknown as { Parser?: LegacyParser }).Parser;
  if (
    parser &&
    parser.prototype.inlineTokenizers &&
    parser.prototype.inlineMethods
  ) {
    const { inlineTokenizers, inlineMethods } = parser.prototype;
    const tokenizers = createTokenizers();
    inlineTokenizers[TYPE_INLINE] = tokenizers.tokenizerInlineMath;
    inlineTokenizers[TYPE_DISPLAY] = tokenizers.tokenizerDisplayMath;
    inlineMethods.splice(inlineMethods.indexOf('text'), 0, TYPE_INLINE);
    inlineMethods.splice(inlineMethods.indexOf('text'), 0, TYPE_DISPLAY);
    return;
  }

  return (tree) => {
    findAndReplace(tree, [
      [
        REGEXP_INLINE,
        (_: string, valueText: string): InlineMath => ({
          type: TYPE_INLINE,
          data: { hName: TYPE_INLINE, value: valueText },
        }),
      ],
      [
        REGEXP_DISPLAY,
        (_: string, valueText: string): DisplayMath => ({
          type: TYPE_DISPLAY,
          data: { hName: TYPE_DISPLAY, value: valueText },
        }),
      ],
    ]);
  };
};

/**
 * A `$$` equation uses display mode (`display="block"`) when its opening fence
 * stands alone on its line, so the captured value begins with a newline
 * (e.g. `$$\nx = y\n$$`). When content follows the opening `$$` on the same line
 * (e.g. `$$a$$`), the equation renders inline.
 */
const isDisplayMode = (value: string): boolean => /^\r?\n/.test(value);

const toMathML = (latex: string, displayMode: boolean): ElementContent[] => {
  const mathml = temml.renderToString(latex.trim(), { displayMode });
  // RootContent = Comment | DocType | Element | Text
  // ElementContent = Comment | Element | Text
  return fromHtml(mathml, { fragment: true }).children.filter(
    (node) => node.type !== 'doctype',
  );
};

/**
 * To align with VFM's future math behavior (see #224), a `$$` equation whose
 * fence stands on its own line is rendered in display mode as
 * `<math display="block">`, rather than as inline math inside a `<p>`.
 */
export const buildDisplayMath = (
  maybeMdastNode: unknown,
  { mathRenderer = 'mathjax' }: MathOptions = {},
): ElementContent[] | undefined => {
  if (mathRenderer !== 'mathml') return undefined;
  if (
    !maybeMdastNode ||
    typeof maybeMdastNode !== 'object' ||
    (maybeMdastNode as { type?: unknown }).type !== 'paragraph'
  ) {
    return undefined;
  }

  const children = (maybeMdastNode as { children?: unknown[] }).children;
  if (!children || children.length !== 1) return undefined;

  const child = children[0] as DisplayMath | undefined;
  if (
    !child ||
    child.type !== TYPE_DISPLAY ||
    !isDisplayMode(child.data.value)
  ) {
    return undefined;
  }

  return toMathML(child.data.value, true);
};

/** `<span class="math inline|display" data-math-typeset="true">` for MathJax. */
const mathSpan = (mode: 'inline' | 'display', text: string): Element => ({
  type: 'element',
  tagName: 'span',
  properties: { className: ['math', mode], dataMathTypeset: 'true' },
  children: [u('text', text)],
});

/**
 * Handle inline math to Hypertext AST.
 * @param options Math options.
 * @returns Hypertext AST handler.
 */
export const handlerInlineMath =
  ({ mathRenderer = 'mathjax' }: MathOptions = {}): Handler =>
  (_state, node: InlineMath) => {
    const value = node.data?.value ?? '';

    if (mathRenderer === 'mathml') {
      return toMathML(value, false);
    }

    return mathSpan('inline', `\\(${value}\\)`);
  };

/**
 * Handle display math to Hypertext AST.
 * @param options Math options.
 * @returns Hypertext AST handler.
 */
export const handlerDisplayMath =
  ({ mathRenderer = 'mathjax' }: MathOptions = {}): Handler =>
  (_state, node: DisplayMath) => {
    const value = node.data?.value ?? '';

    if (mathRenderer === 'mathml') {
      // Inline `<math>`. A display-mode `$$...$$` is intercepted earlier by the
      // `paragraph` handler via `buildDisplayMath`, so it never reaches here.
      return toMathML(value, false);
    }

    return mathSpan('display', `$$${value}$$`);
  };

/**
 * Process math related Hypertext AST.
 * Set the `<script>` to load MathJax and `<body>` attribute that enable math typesetting.
 *
 * This function does the work even if it finds a `<math>` that it does not treat as a VFM. Therefore, call it only if the VFM math renderer is `'mathjax'`.
 */
export const hast =
  ({ math = true, mathRenderer = 'mathjax' }: MathOptions = {}) =>
  (tree: HastRoot) => {
    if (
      !math ||
      mathRenderer !== 'mathjax' ||
      !(select('[data-math-typeset="true"]', tree) || select('math', tree))
    ) {
      return;
    }

    visit(tree, 'element', (node) => {
      switch (node.tagName) {
        case 'head':
          node.children.push({
            type: 'element',
            tagName: 'script',
            properties: {
              async: true,
              src: MATH_URL,
            },
            children: [],
          });
          node.children.push({ type: 'text', value: '\n' });
          break;
      }
    });
  };
