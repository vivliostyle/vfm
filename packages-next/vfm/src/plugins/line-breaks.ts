import breaks from 'remark-breaks';
import * as v from 'valibot';

export const LineBreaksOptionsSchema = v.object({
  hardLineBreaks: v.optional(
    v.pipe(
      v.boolean(),
      v.description(
        'Add `<br>` at the position of hard line breaks, without needing spaces.',
      ),
    ),
  ),
});

export type LineBreaksOptions = v.InferInput<typeof LineBreaksOptionsSchema>;

/**
 * mdast slot: remark-breaks when `hardLineBreaks` is set, otherwise a no-op.
 * @param options - Line break options.
 * @returns Plugin.
 */
export const mdast = ({ hardLineBreaks = false }: LineBreaksOptions = {}) =>
  hardLineBreaks ? breaks : () => () => {};
