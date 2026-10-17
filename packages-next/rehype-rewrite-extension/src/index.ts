import type * as hast from 'hast';
import { getAttribute as getAttributeHast2 } from 'hast-util-get-attribute';
import { selectAll } from 'hast-util-select';
import type * as unist from 'unist';
import {
  parse as parseUri,
  serialize as serializeUri,
  type URIComponents,
} from 'uri-js';
import { parse as parsePath } from 'upath';
import * as v from 'valibot';

export type URIExtensionParts = Omit<URIComponents, 'path'> & {
  path: string;
  base: string;
  /** Path extension without the leading dot. */
  extension: string;
};

export type ExtensionResolver = (parts: URIExtensionParts) => string | null;

/**
 * `hast-util-get-attribute` 1.x is typed against `@types/hast` 2. Its
 * `Readonly<Element>` parameter rejects `@types/hast` 3 elements under
 * `exactOptionalPropertyTypes` only because of the `| undefined` on
 * `position`; the runtime shape is identical.
 * @todo Drop this cast once `hast-util-get-attribute` ships `@types/hast` 3 types.
 */
const getAttribute = getAttributeHast2 as unknown as (
  element: hast.Element,
  qualifiedName: string,
  options?: { root?: hast.Root | hast.Element },
) => string | null;

export const RewriteExtensionOptionsSchema = v.object({
  rules: v.pipe(
    v.array(
      v.object({
        selector: v.string(),
        property: v.string(),
        resolver: v.pipe(
          v.function() as v.GenericSchema<ExtensionResolver>,
          v.description(
            'Return the destination extension for a parsed URI property, or `null` to leave the property unchanged.',
          ),
        ),
      }),
    ),
    v.readonly(),
    v.description(
      'Rules containing a CSS selector, hast property name, and URI extension resolver.',
    ),
  ),
});

export type RewriteExtensionOptions = v.InferOutput<
  typeof RewriteExtensionOptionsSchema
>;

/**
 * Rewrite the extension of the path of a URI reference through `resolver`.
 * @param value - Property value (URI reference).
 * @param resolver - Decides the destination extension.
 * @returns Rewritten URI reference, or `null` when the path is empty, ends
 *   with `/`, or the resolver returns `null`.
 */
const rewritePropertyExtension = (
  value: string,
  resolver: ExtensionResolver,
): string | null => {
  const components = parseUri(value);
  const { path } = components;
  if (path === undefined || path === '' || path.endsWith('/')) {
    return null;
  }
  const { ext } = parsePath(path);
  const base = ext === '' ? path : path.slice(0, -ext.length);
  const extension = ext.slice(1);
  const destinationExtension = resolver({
    ...components,
    path,
    base,
    extension,
  });
  if (destinationExtension === null) {
    return null;
  }
  return serializeUri(
    {
      ...components,
      path: `${base}.${destinationExtension}`,
    },
    { absolutePath: true },
  );
};

/**
 * rehype plugin: for each rule, select elements, read the property as its
 * attribute string and rewrite the extension of its path.
 * @param options - Rules (selector, property name and resolver).
 * @returns Transformer.
 */
export const rewriteExtension =
  ({ rules }: RewriteExtensionOptions) =>
  (tree: unist.Node) => {
    const root = tree as hast.Root;
    for (const { selector, property, resolver } of rules) {
      for (const element of selectAll(selector, root)) {
        const value = getAttribute(element, property, { root });
        if (value === null) {
          continue;
        }
        const rewritten = rewritePropertyExtension(value, resolver);
        if (rewritten !== null) {
          (element.properties ??= {})[property] = rewritten;
        }
      }
    }
  };
