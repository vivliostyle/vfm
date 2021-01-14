import doc from 'rehype-document';
import rehypeStringify from 'rehype-stringify';
import unified, { Processor } from 'unified';
import { hast as clearHtmlLang } from './plugins/clear-html-lang';
import { replace as handleReplace, ReplaceRule } from './plugins/replace';
import markdown from './revive-parse';
import html from './revive-rehype';
import { debug } from './utils/debug';

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
  language = undefined,
  replace = undefined,
}: StringifyMarkdownOptions = {}): Processor {
  const processor = unified()
    .use(markdown)
    .data('settings', { position: false })
    .use(html);

  if (replace) {
    processor.use(handleReplace, { rules: replace });
  }

  if (!partial) {
    processor.use(doc, { language, css: style, title });
    if (!language) {
      processor.use(clearHtmlLang);
    }
  }

  processor.use(rehypeStringify);

  return processor;
}

export function stringify(
  markdownString: string,
  options: StringifyMarkdownOptions = {},
): string {
  const processor = VFM(options);
  const vfile = processor.processSync(markdownString);
  debug(vfile.data);
  return String(vfile);
}
