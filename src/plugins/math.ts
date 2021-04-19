import { Element } from 'hast';
import findReplace from 'mdast-util-find-and-replace';
import { Handler } from 'mdast-util-to-hast';
import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import u from 'unist-builder';
import visit from 'unist-util-visit';

/** Inline math format, e.g. `$...$`. */
const regexpInline = /\$([^$].*?[^$])\$(?!\$)/g;

/** Display math format, e.g. `$$...$$`. */
const regexpDisplay = /\$\$([^$].*?[^$])\$\$(?!\$)/g;

/** Type of inline math in Markdown AST. */
const typeInline = 'inlineMath';

/** Type of display math in Markdown AST. */
const typeDisplay = 'displayMath';

/** URL of MathJax v2 supported by Vivliostyle. */
const mathUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';

const createTokenizer = () => {
  const tokenizerInlineMath: Tokenizer = function (eat, value, silent) {
    if (!value.startsWith('$') || value.startsWith('$$')) {
      return;
    }

    const match = new RegExp(regexpInline).exec(value);
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
      type: typeInline,
      children: [],
      data: { hName: typeInline, value: valueText },
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

    const match = new RegExp(regexpDisplay).exec(value);
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
      type: typeDisplay,
      children: [],
      data: { hName: typeDisplay, value: valueText },
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
  // For less than remark 13 with exclusive other markdown syntax
  if (
    this.Parser &&
    this.Parser.prototype.inlineTokenizers &&
    this.Parser.prototype.inlineMethods
  ) {
    const { inlineTokenizers, inlineMethods } = this.Parser.prototype;
    const tokenizers = createTokenizer();
    inlineTokenizers[typeInline] = tokenizers.tokenizerInlineMath;
    inlineTokenizers[typeDisplay] = tokenizers.tokenizerDisplayMath;
    inlineMethods.splice(inlineMethods.indexOf('text'), 0, typeInline);
    inlineMethods.splice(inlineMethods.indexOf('text'), 0, typeDisplay);
    return;
  }

  return (tree: Node) => {
    findReplace(tree, regexpInline, (_: string, valueText: string) => {
      return {
        type: typeInline,
        data: {
          hName: typeInline,
          value: valueText,
        },
        children: [],
      };
    });

    findReplace(tree, regexpDisplay, (_: string, valueText: string) => {
      return {
        type: typeDisplay,
        data: {
          hName: typeDisplay,
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
  if (!node.data) node.data = {};

  return u('text', `\\(${node.data.value as string}\\)`);
};

/**
 * Handle display math to Hypertext AST.
 * @param h Hypertext AST formatter.
 * @param node Node.
 * @returns Hypertext AST.
 */
export const handlerDisplayMath: Handler = (h, node: Node) => {
  if (!node.data) node.data = {};

  return u('text', `$$${node.data.value as string}$$`);
};

/**
 * Process math related Hypertext AST.
 * Set the `<script>` to load MathJax and `<body>` attribute that enable math typesetting.
 */
export const hast = () => (tree: Node) => {
  visit<Element>(tree, 'element', (node) => {
    switch (node.tagName) {
      case 'head':
        node.children.push({
          type: 'element',
          tagName: 'script',
          properties: {
            async: true,
            src: mathUrl,
          },
          children: [],
        });
        node.children.push({ type: 'text', value: '\n' });
        break;

      case 'body':
        node.properties = { ...node.properties, 'data-math-typeset': true };
        break;
    }
  });
};
