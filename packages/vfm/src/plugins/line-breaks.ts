import breaks from 'remark-breaks';

export type LineBreaksOptions = {
  /** Add `<br>` at the position of hard line breaks, without needing spaces. */
  hardLineBreaks?: boolean | undefined;
};

export const mdast = ({ hardLineBreaks = false }: LineBreaksOptions = {}) =>
  hardLineBreaks ? breaks : () => () => {};
