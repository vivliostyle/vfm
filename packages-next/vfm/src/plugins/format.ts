import rehypeFormat from 'rehype-format';
import * as v from 'valibot';

export const FormatOptionsSchema = v.object({
  disableFormatHtml: v.optional(
    v.pipe(v.boolean(), v.description('Disable automatic HTML format.')),
  ),
});

export type FormatOptions = v.InferInput<typeof FormatOptionsSchema>;

/**
 * hast slot: rehype-format, or a no-op when `disableFormatHtml` is set.
 * @param options - Format options.
 * @returns Plugin.
 */
export const hast = ({ disableFormatHtml = false }: FormatOptions = {}) =>
  disableFormatHtml ? () => () => {} : rehypeFormat;
