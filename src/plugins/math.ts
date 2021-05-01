import { Element } from 'hast';
import findReplace from 'mdast-util-find-and-replace';
import { Handler } from 'mdast-util-to-hast';
import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import u from 'unist-builder';
import visit from 'unist-util-visit';

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

/** The flag indicates that math syntax was actually processed. */
let MATH_PROCESSED = false;

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
      children: [],
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
      children: [],
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
 * @returns Transformer or undefined (less than remark 13).
 */
export const mdast: Plugin = function (): Transformer | undefined {
  MATH_PROCESSED = false;

  // For less than remark 13 with exclusive other markdown syntax
  if (
    this.Parser &&
    this.Parser.prototype.inlineTokenizers &&
    this.Parser.prototype.inlineMethods
  ) {
    const { inlineTokenizers, inlineMethods } = this.Parser.prototype;
    const tokenizers = createTokenizers();
    inlineTokenizers[TYPE_INLINE] = tokenizers.tokenizerInlineMath;
    inlineTokenizers[TYPE_DISPLAY] = tokenizers.tokenizerDisplayMath;
    inlineMethods.splice(inlineMethods.indexOf('text'), 0, TYPE_INLINE);
    inlineMethods.splice(inlineMethods.indexOf('text'), 0, TYPE_DISPLAY);
    return;
  }

  return (tree: Node) => {
    findReplace(tree, REGEXP_INLINE, (_: string, valueText: string) => {
      return {
        type: TYPE_INLINE,
        data: {
          hName: TYPE_INLINE,
          value: valueText,
        },
        children: [],
      };
    });

    findReplace(tree, REGEXP_DISPLAY, (_: string, valueText: string) => {
      return {
        type: TYPE_DISPLAY,
        data: {
          hName: TYPE_DISPLAY,
          value: valueText,
        },
        children: [],
      };
    });
  };
};

/**
 * Handle inline math to Hypertext AST.
 * @param h Hypertext AST formatter.
 * @param node Node.
 * @returns Hypertext AST.
 */
export const handlerInlineMath: Handler = (h, node: Node) => {
  if (!node.data) {
    node.data = {};
  }

  MATH_PROCESSED = true;

  return h(
    {
      type: 'element',
    },
    'span',
    {
      class: 'math inline',
    },
    [u('text', `\\(${node.data.value as string}\\)`)],
  );
};

/**
 * Handle display math to Hypertext AST.
 * @param h Hypertext AST formatter.
 * @param node Node.
 * @returns Hypertext AST.
 */
export const handlerDisplayMath: Handler = (h, node: Node) => {
  if (!node.data) node.data = {};

  MATH_PROCESSED = true;

  return h(
    {
      type: 'element',
    },
    'span',
    {
      class: 'math display',
    },
    [u('text', `$$${node.data.value as string}$$`)],
  );
};

/**
 * Process math related Hypertext AST.
 * Set the `<script>` to load MathJax and `<body>` attribute that enable math typesetting.
 */
export const hast = () => (tree: Node) => {
  if (!MATH_PROCESSED) {
    return;
  }

  MATH_PROCESSED = false;

  visit<Element>(tree, 'element', (node) => {
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

      case 'body':
        node.properties = { ...node.properties, 'data-math-typeset': 'true' };
        break;
    }
  });
};
