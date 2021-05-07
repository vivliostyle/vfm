import footnotes from 'remark-footnotes';

/**
 * Process Markdown AST.
 */
export const mdast = [footnotes, { inlineNotes: true }];
