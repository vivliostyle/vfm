import doc from 'rehype-document';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import unified, { Processor } from 'unified';
import { hast as hastClearHtmlLang } from './plugins/clear-html-lang';
import { hast as hastMath } from './plugins/math';
import { hast as hastMetadata, MetadataVFile } from './plugins/metadata';
import { replace as handleReplace, ReplaceRule } from './plugins/replace';
import { reviveParse as markdown } from './revive-parse';
import { reviveRehype as html } from './revive-rehype';
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
  /** Enable math syntax. */
  math?: boolean;
}

export interface Hooks {
  afterParse: ReplaceRule[];
}

/**
 * Update the settings by comparing the options with the frontmatter metadata.
 * @param options Options.
 * @param md Markdown string.
 * @returns Options updated by checking.
 */
const checkOptions = (options: StringifyMarkdownOptions, md: string) => {
  // Reduce processing as much as possible because it only reads metadata.
  const processor = VFM({ partial: true, disableFormatHtml: true });
  const metadata = (processor.processSync(md) as MetadataVFile).data;
  const opts = options;

  opts.title = metadata.title === undefined ? opts.title : metadata.title;
  opts.math = metadata.math === undefined ? opts.math : metadata.math;

  return opts;
};

/**
 * Create Unified processor for Markdown AST and Hypertext AST.
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
  math = true,
}: StringifyMarkdownOptions = {}): Processor {
  const processor = unified()
    .use(markdown(hardLineBreaks, math))
    .data('settings', { position: false })
    .use(html);

  if (replace) {
    processor.use(handleReplace, { rules: replace });
  }

  if (!partial) {
    processor.use(doc, { language, css: style, title });
    if (!language) {
      processor.use(hastClearHtmlLang);
    }
  }

  processor.use(hastMetadata);
  processor.use(rehypeStringify);

  // Must be run after `rehype-document` to write to `<head>`
  if (math) {
    processor.use(hastMath);
  }

  // Explicitly specify true if want unformatted HTML during development or debug
  if (!disableFormatHtml) {
    processor.use(rehypeFormat);
  }

  return processor;
}

/**
 * Convert markdown to a stringify (HTML).
 * @param markdownString Markdown string.
 * @param options Options.
 * @returns HTML string.
 */
export function stringify(
  markdownString: string,
  options: StringifyMarkdownOptions = {},
): string {
  const processor = VFM(checkOptions(options, markdownString));
  const vfile = processor.processSync(markdownString);
  debug(vfile.data);
  return String(vfile);
}
