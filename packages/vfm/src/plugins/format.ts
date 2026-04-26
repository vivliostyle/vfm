import rehypeFormat from 'rehype-format';

export type FormatOptions = {
  /** Disable automatic HTML format. */
  disableFormatHtml?: boolean | undefined;
};

export const hast = ({ disableFormatHtml = false }: FormatOptions = {}) =>
  disableFormatHtml ? () => () => {} : rehypeFormat;
