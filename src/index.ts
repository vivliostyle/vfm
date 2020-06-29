import doc from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import unified, {Processor} from 'unified';
import {replace as handleReplace, ReplaceRule} from './replace';
import markdown from './revive-parse';
import html from './revive-rehype';

export interface StringifyMarkdownOptions {
  stylesheet?: string;
  partial?: boolean;
  title?: string;
  replace?: ReplaceRule[];
}

export interface Hooks {
  afterParse: ReplaceRule[];
}

export function VFM({
  stylesheet = undefined,
  partial = false,
  title = undefined,
  replace = [],
}: StringifyMarkdownOptions = {}): Processor {
  const processor = unified().use(markdown).use(html);
  if (replace.length > 0) {
    processor.use(handleReplace, {rules: replace});
  }
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

  return String(processor.processSync(markdownString));
}
