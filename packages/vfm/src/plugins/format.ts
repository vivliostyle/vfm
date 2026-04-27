import rehypeFormat from 'rehype-format';
import * as v from 'valibot';

export const FormatOptionsSchema = v.object({
  disableFormatHtml: v.optional(
    v.pipe(v.boolean(), v.description('Disable automatic HTML format.')),
  ),
});

export type FormatOptions = v.InferInput<typeof FormatOptionsSchema>;

export const hast = ({ disableFormatHtml = false }: FormatOptions = {}) =>
  disableFormatHtml ? () => () => {} : rehypeFormat;
