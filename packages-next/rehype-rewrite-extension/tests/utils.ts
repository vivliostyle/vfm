import type * as unist from 'unist';
import { rewriteExtension, type ExtensionResolver } from '../src/index.js';

/**
 * Resolver that rewrites `md` to `html` and leaves other extensions alone.
 */
export const markdownToHtml: ExtensionResolver = ({ extension }) =>
  extension === 'md' ? 'html' : null;

/**
 * Resolver that never rewrites.
 */
export const leaveUnchanged: ExtensionResolver = () => null;

/**
 * Single rule that applies `resolver` to the `href` of every element that has
 * one.
 * @param resolver - Extension resolver.
 * @returns Rules.
 */
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

/**
 * Build a root with one `<a href>` element.
 * @param href - Initial `href`.
 * @returns Tree.
 */
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

/**
 * Read the `href` of the anchor in a tree built by {@link treeWithHref}.
 * @param tree - Tree.
 * @returns Current `href`.
 */
export const hrefOf = (tree: AnchorTree): string =>
  tree.children[0].properties.href;

/**
 * Run `rewriteExtension` on a one-anchor tree.
 * @param href - Initial `href`.
 * @param options - `resolveExtension` to use (default {@link markdownToHtml}).
 * @returns The tree after rewriting.
 */
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
