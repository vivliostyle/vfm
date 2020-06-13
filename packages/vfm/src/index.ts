import unified from 'unified';
import doc from 'rehype-document';
import stringify from 'rehype-stringify';

import markdown from './revive-parse';
import revive2rehype from './revive-rehype';

export interface StringifyMarkdownOptions {
  stylesheet?: string;
  partial?: boolean;
}

export function stringifyMarkdown(
  markdownString: string,
  {stylesheet = undefined, partial = false}: StringifyMarkdownOptions = {},
): string {
  const processor = unified().use(markdown).use(revive2rehype);

  if (!partial) {
    processor.use(doc, {language: 'ja', css: stylesheet});
  }

  processor.use(stringify);

  return String(processor.processSync(markdownString));
}
