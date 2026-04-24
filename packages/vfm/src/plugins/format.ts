import rehypeFormat from 'rehype-format';
import type * as unified from 'unified';

export type FormatOptions = {
  /** Disable automatic HTML format. */
  disableFormatHtml?: boolean | undefined;
};

export const hast: unified.Plugin<[FormatOptions]> = function ({
  disableFormatHtml = false,
}: FormatOptions = {}) {
  return disableFormatHtml ? () => {} : rehypeFormat.call(this);
};
