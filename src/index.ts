import doc from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import unified, {Processor} from 'unified';
import {replace as handleReplace, ReplaceRule} from './replace';
import markdown from './revive-parse';
import html from './revive-rehype';

export interface StringifyMarkdownOptions {
  style?: string | string[];
  partial?: boolean;
  title?: string;
  language?: string;
  replace?: ReplaceRule[];
}

export interface Hooks {
  afterParse: ReplaceRule[];
}

export function VFM({
  style = undefined,
  partial = false,
  title = undefined,
  language = 'en',
  replace = [],
}: StringifyMarkdownOptions = {}): Processor {
  const processor = unified().use(markdown).use(html);
  if (replace.length > 0) {
    processor.use(handleReplace, {rules: replace});
  }
  if (!partial) {
    processor.use(doc, {language, css: style, title});
  }
  processor.use(rehypeStringify);

  return processor;
}

export function stringify(
  markdownString: string,
  options: StringifyMarkdownOptions = {},
): string {
  const processor = VFM(options);

  return String(processor.processSync(markdownString));
}
