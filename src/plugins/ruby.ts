import type { Root as MdastRoot } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Handler, State } from 'mdast-util-to-hast';
import type { Plugin } from 'unified';
import { u } from 'unist-builder';

/**
 * Process Markdown AST: detect ruby syntax {content|rubyText} and create ruby nodes.
 * Supports escaped pipe `\|` in content (e.g., `{a\|b|c}` → ruby body "a|b", rt "c").
 */
export const mdast: Plugin = () => {
  return (tree) => {
    findAndReplace(tree as MdastRoot, [
      /\{((?:[^{}|\\]|\\[|\\])*)\|((?:[^{}])*)\}/g,
      (_: string, rawContent: string, rubyText: string) => {
        // Unescape \| → |
        const inlineContent = rawContent.replace(/\\\|/g, '|');
        return {
          type: 'ruby' as any,
          data: { hName: 'ruby', rubyText },
          children: [{ type: 'text', value: inlineContent }],
        };
      },
    ]);
  };
};

// rehype handler
export const handler: Handler = (state, node) => {
  if (!node.data) node.data = {};
  const rtNode: import('hast').Element = {
    type: 'element',
    tagName: 'rt',
    properties: {},
    children: [u('text', node.data.rubyText as string)],
  };

  const children = state.all(node);
  const result: import('hast').Element = {
    type: 'element',
    tagName: 'ruby',
    properties: {},
    children: [...children, rtNode],
  };
  state.patch(node, result);
  return result;
};
