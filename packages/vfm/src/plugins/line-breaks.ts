import breaks from 'remark-breaks';
import type * as unified from 'unified';

export type LineBreaksOptions = {
  /** Add `<br>` at the position of hard line breaks, without needing spaces. */
  hardLineBreaks: boolean;
};

export const mdast: unified.Plugin<[LineBreaksOptions]> = function ({
  hardLineBreaks,
}: LineBreaksOptions) {
  if (!hardLineBreaks) return;
  breaks.call(this);
};
