import type { Root as HastRoot } from 'hast';
import { select } from 'hast-util-select';
import type { Root as MdastRoot } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Handler, State } from 'mdast-util-to-hast';
import type { Plugin, Transformer } from 'unified';
import type { Node } from 'unist';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

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
 * Process Markdown AST.
 * @returns Transformer.
 */
export const mdast: Plugin = (): Transformer => {
  return (tree: Node) => {
    findAndReplace(tree as MdastRoot, [
      REGEXP_INLINE,
      (_: string, valueText: string) => {
        return {
          type: TYPE_INLINE as any,
          data: {
            hName: TYPE_INLINE,
            value: valueText,
          },
          children: [],
        };
      },
    ]);

    findAndReplace(tree as MdastRoot, [
      REGEXP_DISPLAY,
      (_: string, valueText: string) => {
        return {
          type: TYPE_DISPLAY as any,
          data: {
            hName: TYPE_DISPLAY,
            value: valueText,
          },
          children: [],
        };
      },
    ]);
  };
};

/**
 * Handle inline math to Hypertext AST.
 */
export const handlerInlineMath: Handler = (state, node) => {
  if (!node.data) {
    node.data = {};
  }

  const result: import('hast').Element = {
    type: 'element',
    tagName: 'span',
    properties: {
      class: 'math inline',
      'data-math-typeset': 'true',
    },
    children: [u('text', `\\(${node.data.value as string}\\)`)],
  };
  state.patch(node, result);
  return result;
};

/**
 * Handle display math to Hypertext AST.
 */
export const handlerDisplayMath: Handler = (state, node) => {
  if (!node.data) {
    node.data = {};
  }

  const result: import('hast').Element = {
    type: 'element',
    tagName: 'span',
    properties: {
      class: 'math display',
      'data-math-typeset': 'true',
    },
    children: [u('text', `$$${node.data.value as string}$$`)],
  };
  state.patch(node, result);
  return result;
};

/**
 * Process math related Hypertext AST.
 * Set the `<script>` to load MathJax and `<body>` attribute that enable math typesetting.
 *
 * This function does the work even if it finds a `<math>` that it does not treat as a VFM. Therefore, call it only if the VFM option is `math: true`.
 */
export const hast = () => (tree: Node) => {
  if (
    !(
      select('[data-math-typeset="true"]', tree as HastRoot) ||
      select('math', tree as HastRoot)
    )
  ) {
    return;
  }

  visit(tree as HastRoot, 'element', (node) => {
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
