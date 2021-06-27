import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import unified, { Processor } from 'unified';
import { mdast as doc } from './plugins/document';
//import { mdast as doc } from './plugins/document.old';
import { hast as hastMath } from './plugins/math';
import { Metadata, readMetadata } from './plugins/metadata';
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
 * Check the metadata with options.
 * @param metadata Metadata.
 * @param options Options.
 * @returns Checked metadata.
 */
const checkMetadata = (
  metadata: Metadata,
  options: StringifyMarkdownOptions,
) => {
  const result = { ...metadata };

  if (metadata.title === undefined && options.title !== undefined) {
    result.title = options.title;
  }

  if (metadata.lang === undefined && options.language !== undefined) {
    result.lang = options.language;
  }

  if (options.style) {
    if (metadata.link === undefined) {
      metadata.link = [];
    }

    if (typeof options.style === 'string') {
      metadata.link.push([
        { name: 'rel', value: 'stylesheet' },
        { name: 'href', value: options.style },
      ]);
    } else if (Array.isArray(options.style)) {
      for (const style of options.style) {
        metadata.link.push([
          { name: 'rel', value: 'stylesheet' },
          { name: 'href', value: style },
        ]);
      }
    }
  }

  return result;
};

/**
 * Create Unified processor for Markdown AST and Hypertext AST.
 * @param options Options.
 * @returns Unified processor.
 */
export function VFM(
  {
    style = undefined,
    partial = false,
    title = undefined,
    language = undefined,
    replace = undefined,
    hardLineBreaks = false,
    disableFormatHtml = false,
    math = true,
  }: StringifyMarkdownOptions = {},
  metadata: Metadata = {},
): Processor {
  const meta = checkMetadata(metadata, { style, title, language });
  if (meta.vfm && meta.vfm.math !== undefined) {
    math = meta.vfm.math;
  }

  const processor = unified()
    .use(markdown(hardLineBreaks, math))
    .data('settings', { position: false })
    .use(html);

  if (replace) {
    processor.use(handleReplace, { rules: replace });
  }

  if (!partial) {
    processor.use(doc, meta);
  }

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
  const processor = VFM(options, readMetadata(markdownString));
  const vfile = processor.processSync(markdownString);
  debug(vfile.data);
  return String(vfile);
}
