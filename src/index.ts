import doc from 'rehype-document';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import unified, { Processor } from 'unified';
import { hast as clearHtmlLang } from './plugins/clear-html-lang';
import { hast as metadata } from './plugins/metadata';
import { replace as handleReplace, ReplaceRule } from './plugins/replace';
import { reviveParse as markdown } from './revive-parse';
import html from './revive-rehype';
import { debug } from './utils';

/**
 * Option for convert Markdown to a stringify (HTML).
 */
export interface StringifyMarkdownOptions {
  /** Custom stylesheet path/URL. */
  style?: string | string[];
  /** Output markdown fragments.  */
  partial?: boolean;
  /** Document title (ignored in partial mode). */
  title?: string;
  /** Document language (ignored in partial mode). */
  language?: string;
  /** Replacement handler for HTML string. */
  replace?: ReplaceRule[];
  /** Add `<br>` at the position of hard line breaks, without needing spaces. */
  hardLineBreaks?: boolean;
  /** Disable automatic HTML format. */
  disableFormatHtml?: boolean;
}

export interface Hooks {
  afterParse: ReplaceRule[];
}

/**
 * Create Unified processor for MDAST and HAST.
 * @param options Options.
 * @returns Unified processor.
 */
export function VFM({
  style = undefined,
  partial = false,
  title = undefined,
  language = undefined,
  replace = undefined,
  hardLineBreaks = false,
  disableFormatHtml = false,
}: StringifyMarkdownOptions = {}): Processor {
  const processor = unified()
    .use(markdown({ hardLineBreaks }))
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

  processor.use(metadata);
  processor.use(rehypeStringify);

  // Explicitly specify true if want unformatted HTML during development or debug
  if (!disableFormatHtml) {
    processor.use(rehypeFormat);
  }

  return processor;
}

/**
 * Convert Markdown to a stringify (HTML).
 * @param markdownString Markdown string.
 * @param options Options.
 * @returns HTML string.
 */
export function stringify(
  markdownString: string,
  options: StringifyMarkdownOptions = {},
): string {
  const processor = VFM(options);
  const vfile = processor.processSync(markdownString);
  debug(vfile.data);
  return String(vfile);
}
