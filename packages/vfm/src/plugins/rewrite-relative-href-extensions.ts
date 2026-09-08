import * as v from 'valibot';
import type { ExtensionResolver } from '@vivliostyle/rehype-rewrite-extension';

export interface RewriteRelativeHrefExtensionsOptions {
  rewriteRelativeHrefExtensions?: boolean | readonly string[] | undefined;
}

export const RewriteRelativeHrefExtensionsOptionsSchema: v.GenericSchema<RewriteRelativeHrefExtensionsOptions> =
  v.object({
    rewriteRelativeHrefExtensions: v.optional(
      v.pipe(
        v.union([v.boolean(), v.array(v.string())]),
        v.description(
          'Rewrite the trailing extension of relative hyperlink hrefs to *.html. `true` is shorthand for `["md"]`; pass an array (e.g. `["md", "adoc"]`) to broaden the set of source extensions whose links get rewritten.',
        ),
      ),
    ),
  });

export const resolveRewriteRelativeHrefExtensions = (
  value: RewriteRelativeHrefExtensionsOptions['rewriteRelativeHrefExtensions'],
): ExtensionResolver => {
  const sources =
    value === true
      ? ['md']
      : value === false || value === undefined
        ? []
        : value.map((extension) =>
            extension.startsWith('.') ? extension.slice(1) : extension,
          );
  return ({ scheme, host, path, extension }) =>
    scheme === undefined &&
    host === undefined &&
    path !== undefined &&
    !path.startsWith('/') &&
    sources.includes(extension)
      ? 'html'
      : null;
};
