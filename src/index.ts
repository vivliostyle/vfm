import doc from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import unified, {Processor} from 'unified';
import markdown from './revive-parse';
import html from './revive-rehype';

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

  return String(processor.processSync(markdownString));
}
