import type * as hast from 'hast';
import type * as unist from 'unist';
import { visit } from 'unist-util-visit';
import { parse as parseUri } from 'uri-js';
import * as v from 'valibot';

/**
 * Options for {@link rewriteLocalHrefExtensions}. The extension list
 * is read-only; the plugin never mutates it. `string[]` is structurally
 * assignable to `readonly string[]`, so callers may pass either form.
 */
export interface RewriteLocalHrefExtensionsOptions {
  rewriteLocalHrefExtensions?: boolean | readonly string[] | undefined;
}

export const RewriteLocalHrefExtensionsOptionsSchema: v.GenericSchema<RewriteLocalHrefExtensionsOptions> =
  v.object({
    rewriteLocalHrefExtensions: v.optional(
      v.pipe(
        v.union([v.boolean(), v.array(v.string())]),
        v.description(
          'Rewrite local document hrefs to *.html. `true` is shorthand for `["md"]`; pass an array (e.g. `["md", "adoc"]`) to broaden the set of source extensions whose links get rewritten. Remote URLs are left untouched. The rewrite is purely syntactic. The file system is not consulted, so producing the target `*.html` is the embedder\'s responsibility.',
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
 * extension to `.html` when the reference is local (no scheme, no
 * authority) and its extension matches one of `extensions`. Tail
 * components (query, fragment, percent-encoding) are preserved
 * verbatim.
 */
const rewriteHref = (
  href: string,
  extensions: readonly string[],
): string | undefined => {
  const r = parseUri(href);
  if (r.scheme !== undefined || r.host !== undefined) return undefined;
  const path = r.path;
  if (!path) return undefined;
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
  visit(tree as hast.Root, 'element', (node) => {
    const href = node.properties?.href;
    if (typeof href !== 'string') return;
    const rewritten = rewriteHref(href, extensions);
    if (rewritten !== undefined) {
      (node.properties ??= {}).href = rewritten;
    }
  });
};

/**
 * Rewrite local relative document hrefs (`./x.ext`, `../x.ext`,
 * `x.ext`) to `*.html` for each `ext` listed in the option. `true` is
 * shorthand for `['md']`, supporting the standard VFM Markdown
 * pipeline; pass an array such as `['md', 'adoc']` when the same
 * unified processor also handles other source formats. Remote URLs
 * (`https://...`, `//host/...`, `mailto:`, etc.) are left untouched.
 * Query strings, fragments, and percent-encoded characters in the path
 * are preserved across the rewrite. The plugin does not consult the
 * file system: whether the target `.html` is actually produced and
 * served is the embedder's concern.
 */
export const rewriteLocalHrefExtensions =
  ({
    rewriteLocalHrefExtensions: extensions = false,
  }: RewriteLocalHrefExtensionsOptions = {}) =>
  (tree: unist.Node) =>
    rewriteTree(tree, resolveExtensions(extensions));
