import doc from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import unified, {Processor} from 'unified';
import markdown from './revive-parse';
import html from './revive-rehype';
import {debug} from './utils/debug';

export interface StringifyMarkdownOptions {
  stylesheet?: string;
  partial?: boolean;
  title?: string;
}

export function VFM({
  stylesheet = undefined,
  partial = false,
  title = undefined,
}: StringifyMarkdownOptions = {}): Processor {
  const processor = unified().use(markdown).use(html);
  if (!partial) {
    processor.use(doc, {language: 'ja', css: stylesheet, title});
  }
  processor.use(rehypeStringify);

  return processor;
}

export function stringify(
  markdownString: string,
  options: StringifyMarkdownOptions = {},
): string {
  const processor = VFM(options);

  if (debug.enabled) {
    const inspect = require('unist-util-inspect');
    debug(inspect(processor.parse(markdownString)));
  }

  return String(processor.processSync(markdownString));
}
