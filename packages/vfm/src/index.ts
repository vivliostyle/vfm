import unified from 'unified';
import doc from 'rehype-document';
import stringify from 'rehype-stringify';

import markdown from './revive-parse';
import html from './revive-rehype';

const debugMode = process.env.DEBUG;

export interface StringifyMarkdownOptions {
  stylesheet?: string;
  partial?: boolean;
}

export function stringifyMarkdown(
  markdownString: string,
  {stylesheet = undefined, partial = false}: StringifyMarkdownOptions = {},
): string {
  const processor = unified().use(markdown).use(html);

  if (!partial) {
    processor.use(doc, {language: 'ja', css: stylesheet});
  }

  processor.use(stringify);

  if (debugMode) {
    const inspect = require('unist-util-inspect');
    console.log(inspect(processor.parse(markdownString)));
  }

  return String(processor.processSync(markdownString));
}
