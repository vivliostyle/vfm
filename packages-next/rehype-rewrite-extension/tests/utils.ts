import type * as unist from 'unist';
import { rewriteExtension, type ExtensionResolver } from '../src/index.js';

export const markdownToHtml: ExtensionResolver = ({ extension }) =>
  extension === 'md' ? 'html' : null;

export const leaveUnchanged: ExtensionResolver = () => null;

export const hrefRules = (resolver: ExtensionResolver) =>
  [{ selector: '[href]', property: 'href', resolver }] as const;

export type AnchorTree = {
  type: 'root';
  children: [
    {
      type: 'element';
      tagName: 'a';
      properties: { href: string };
      children: [{ type: 'text'; value: string }];
    },
  ];
};

export const treeWithHref = (href: string): AnchorTree => ({
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'a',
      properties: { href },
      children: [{ type: 'text', value: 'link' }],
    },
  ],
});

export const hrefOf = (tree: AnchorTree): string =>
  tree.children[0].properties.href;

export const runRewrite = (
  href: string,
  {
    resolveExtension = markdownToHtml,
  }: {
    resolveExtension?: ExtensionResolver;
  } = {},
): AnchorTree => {
  const tree = treeWithHref(href);
  rewriteExtension({ rules: hrefRules(resolveExtension) })(
    tree as unknown as unist.Node,
  );
  return tree;
};
