import type * as hast from 'hast';
import { selectAll } from 'hast-util-select';
import type * as unist from 'unist';
import { parse as parseUri } from 'uri-js';
import * as v from 'valibot';

/**
 * Options for {@link rewriteRelativeHrefExtensions}. The extension
 * list is read-only; the plugin never mutates it. `string[]` is
 * structurally assignable to `readonly string[]`, so callers may pass
 * either form.
 */
export interface RewriteRelativeHrefExtensionsOptions {
  rewriteRelativeHrefExtensions?: boolean | readonly string[] | undefined;
}

export const RewriteRelativeHrefExtensionsOptionsSchema: v.GenericSchema<RewriteRelativeHrefExtensionsOptions> =
  v.object({
    rewriteRelativeHrefExtensions: v.optional(
      v.pipe(
        v.union([v.boolean(), v.array(v.string())]),
        v.description(
          'Rewrite the trailing extension of relative hyperlink hrefs to *.html. `true` is shorthand for `["md"]`; pass an array (e.g. `["md", "adoc"]`) to broaden the set of source extensions whose links get rewritten. Only `<a>` and `<area>` elements are touched (the elements that unconditionally create hyperlinks per HTML Standard §4.6); `<base>` and `<link>` are left alone because their `href` is not an author-specified navigation target. Only relative references (no scheme, no host, and the path does not start with `/`) are touched; remote URLs and rooted paths are left untouched. The rewrite is purely syntactic. The file system is not consulted, so producing the target `*.html` is the embedder\'s responsibility.',
        ),
      ),
    ),
  });

/**
 * Normalize the user-facing option into a list of bare extension names
 * (no leading dot). Returns an empty array when the rewrite should be
 * skipped, which the caller uses to bypass the tree walk entirely.
 */
const resolveExtensions = (
  extensions: boolean | readonly string[] | undefined,
): readonly string[] => {
  if (extensions === undefined || extensions === false) return [];
  if (extensions === true) return ['md'];
  return extensions.map((e) => (e.startsWith('.') ? e.slice(1) : e));
};

/**
 * Decompose the href via `uri-js` (RFC 3986) and rewrite the trailing
 * extension to `.html` when the reference is relative — no scheme, no
 * authority, and the path does not start with `/` — and its extension
 * matches one of `extensions`. Tail components (query, fragment,
 * percent-encoding) are preserved verbatim.
 */
const rewriteHref = (
  href: string,
  extensions: readonly string[],
): string | undefined => {
  const r = parseUri(href);
  if (r.scheme !== undefined || r.host !== undefined) return undefined;
  const path = r.path;
  if (!path) return undefined;
  // Rooted paths are excluded from the "relative" definition; see the
  // matching test block for why POSIX-like absolute paths are not
  // supported under Vivliostyle CLI.
  if (path.startsWith('/')) return undefined;
  const lastDot = path.lastIndexOf('.');
  if (lastDot < 0) return undefined;
  const pathExt = path.slice(lastDot + 1);
  if (!extensions.includes(pathExt)) return undefined;
  const newPath = path.slice(0, lastDot) + '.html';
  const search = r.query !== undefined ? `?${r.query}` : '';
  const hash = r.fragment !== undefined ? `#${r.fragment}` : '';
  return newPath + search + hash;
};

const rewriteTree = (tree: unist.Node, extensions: readonly string[]): void => {
  if (extensions.length === 0) return;
  for (const node of selectAll('a[href], area[href]', tree as hast.Root)) {
    const href = node.properties?.href;
    if (typeof href !== 'string') continue;
    const rewritten = rewriteHref(href, extensions);
    if (rewritten !== undefined) {
      (node.properties ??= {}).href = rewritten;
    }
  }
};

/**
 * Rewrite the trailing extension of relative hyperlink hrefs to
 * `.html` for each `ext` listed in the option. `true` is shorthand
 * for `['md']`, supporting the standard VFM Markdown pipeline; pass
 * an array such as `['md', 'adoc']` when the same unified processor
 * also handles other source formats. Query strings, fragments, and
 * percent-encoded characters in the path are preserved across the
 * rewrite. The plugin does not consult the file system: whether the
 * target `.html` is actually produced and served is the embedder's
 * concern.
 *
 * Scope is fixed along two axes, both expressing the same principle:
 * the rewrite is only applied where the build pipeline can be assumed
 * to own the target.
 *
 * - Element axis: only `<a>` and `<area>` are touched. Per HTML
 *   Standard §4.6 (commit snapshot
 *   {@link https://html.spec.whatwg.org/commit-snapshots/6f84b26bd6eb8bd0e0e8df9819e43e901867166b/#links-created-by-a-and-area-elements}),
 *   these are the elements that unconditionally create hyperlinks
 *   when they bear an `href`. The other `href`-bearing elements
 *   (`<base>`, `<link>`) carry document metadata rather than an
 *   author-specified navigation target and are intentionally left
 *   alone.
 * - Path axis: only relative references — no scheme, no host, and
 *   the path does not start with `/` — are touched. Remote URLs
 *   (`https://...`, `//host/...`, `mailto:`, etc.) and rooted paths
 *   (`/abs/...`, drive-letter-prefixed Windows paths) are left
 *   untouched.
 */
export const rewriteRelativeHrefExtensions =
  ({
    rewriteRelativeHrefExtensions: extensions = false,
  }: RewriteRelativeHrefExtensionsOptions = {}) =>
  (tree: unist.Node) =>
    rewriteTree(tree, resolveExtensions(extensions));
