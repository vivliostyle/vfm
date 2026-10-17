import type { Element, ElementContent, Root as HastRoot } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { select } from 'hast-util-select';
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';
import type { Handler } from 'mdast-util-to-hast';
import type { Extension as MicromarkExtension } from 'micromark-util-types';
import temml from 'temml';
import type { Plugin } from 'unified';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';
import {
  mathFromMarkdown,
  type DisplayMath,
  type InlineMath,
} from './math-mdast.js';
import { mathSyntax } from './math-syntax.js';

export type {
  DisplayMath,
  DisplayMathData,
  InlineMath,
  InlineMathData,
} from './math-mdast.js';
export { mathFromMarkdown } from './math-mdast.js';
export { mathSyntax } from './math-syntax.js';

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
 * remark plugin: parse `$...$` / `$$...$$` into `inlineMath` / `displayMath`
 * nodes by registering the VFM math syntax on the processor. When `math` is
 * off nothing is registered, so `$` stays ordinary text.
 * @param options - Math options.
 */
export const mdast: Plugin<[MathOptions?]> = function ({
  math = true,
}: MathOptions = {}) {
  if (!math) return;
  const data = this.data() as {
    micromarkExtensions?: MicromarkExtension[] | undefined;
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined;
  };
  (data.micromarkExtensions ??= []).push(mathSyntax());
  (data.fromMarkdownExtensions ??= []).push(mathFromMarkdown());
};

/**
 * A `$$` equation uses display mode (`display="block"`) when its opening fence
 * stands alone on its line, so the captured value begins with a newline
 * (e.g. `$$\nx = y\n$$`). When content follows the opening `$$` on the same line
 * (e.g. `$$a$$`), the equation renders inline.
 */
const isDisplayMode = (value: string): boolean => /^\r?\n/.test(value);

/**
 * Render LaTeX to MathML with temml and return it as hast children.
 * @param latex - LaTeX source.
 * @param displayMode - Render as `display="block"`.
 * @returns Element content (a leading doctype is dropped).
 */
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
 * @param maybeMdastNode - Paragraph candidate.
 * @param options - Math options.
 * @returns MathML children for a lone display-mode equation, otherwise
 *   `undefined`.
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
  if (!child || child.type !== 'displayMath' || !isDisplayMode(child.value)) {
    return undefined;
  }

  return toMathML(child.value, true);
};

/** `<span class="math inline|display" data-math-typeset="true">` for MathJax. */
const mathSpan = (mode: 'inline' | 'display', text: string): Element => ({
  type: 'element',
  tagName: 'span',
  properties: { className: ['math', mode], dataMathTypeset: 'true' },
  children: [u('text', text)],
});

/**
 * Handle inline math to Hypertext AST: `<math>` for the MathML renderer, or a
 * `<span class="math inline">` holding `\\(...\\)` for MathJax.
 * @param options - Math options.
 * @returns Hypertext AST handler.
 */
export const handlerInlineMath =
  ({ mathRenderer = 'mathjax' }: MathOptions = {}): Handler =>
  (_state, node: InlineMath) => {
    const value = node.value;

    if (mathRenderer === 'mathml') {
      return toMathML(value, false);
    }

    return mathSpan('inline', `\\(${value}\\)`);
  };

/**
 * Handle display math to Hypertext AST: inline `<math>` for the MathML
 * renderer, or a `<span class="math display">` holding `$$...$$` for MathJax.
 * @param options - Math options.
 * @returns Hypertext AST handler.
 */
export const handlerDisplayMath =
  ({ mathRenderer = 'mathjax' }: MathOptions = {}): Handler =>
  (_state, node: DisplayMath) => {
    const value = node.value;

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
 * @param options - Math options.
 * @returns Transformer.
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
