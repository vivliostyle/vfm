import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import unified, { Processor } from 'unified';
import { mdast as doc } from './plugins/document.js';
import { hast as hastMath } from './plugins/math.js';
import { Metadata, readMetadata } from './plugins/metadata.js';
import { replace as handleReplace, ReplaceRule } from './plugins/replace.js';
import { reviveParse as markdown } from './revive-parse.js';
import { reviveRehype as html } from './revive-rehype.js';
import { debug } from './utils.js';

// Expose metadata reading by VFM
export * from './plugins/metadata.js';

/**
 * Option for convert Markdown to a stringify (HTML).
 */
export interface StringifyMarkdownOptions {
  /** Custom stylesheet path/URL. */
  style?: string | string[];
  /** Output markdown fragments. */
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
  /** Order of img and figcaption elements in figure. */
  imgFigcaptionOrder?: 'img-figcaption' | 'figcaption-img';
}

export interface Hooks {
  afterParse: ReplaceRule[];
}

/**
 * Check and update metadata with options.
 * @param metadata Metadata.
 * @param options Options.
 */
const checkMetadata = (
  metadata: Metadata,
  options: StringifyMarkdownOptions,
) => {
  if (metadata.title === undefined && options.title !== undefined) {
    metadata.title = options.title;
  }

  if (metadata.lang === undefined && options.language !== undefined) {
    metadata.lang = options.language;
  }

  if (options.style) {
    if (metadata.link === undefined) {
      metadata.link = [];
    }

    if (typeof options.style === 'string') {
      metadata.link.push([
        { name: 'rel', value: 'stylesheet' },
        { name: 'type', value: 'text/css' },
        { name: 'href', value: options.style },
      ]);
    } else if (Array.isArray(options.style)) {
      for (const style of options.style) {
        metadata.link.push([
          { name: 'rel', value: 'stylesheet' },
          { name: 'type', value: 'text/css' },
          { name: 'href', value: style },
        ]);
      }
    }
  }
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
    imgFigcaptionOrder = undefined,
  }: StringifyMarkdownOptions = {},
  metadata: Metadata = {},
): Processor {
  checkMetadata(metadata, { style, title, language });

  // Prioritize metadata `vfm` settings over options
  if (metadata.vfm) {
    if (metadata.vfm.math !== undefined) {
      math = metadata.vfm.math;
    }
    if (metadata.vfm.partial !== undefined) {
      partial = metadata.vfm.partial;
    }
    if (metadata.vfm.hardLineBreaks !== undefined) {
      hardLineBreaks = metadata.vfm.hardLineBreaks;
    }
    if (metadata.vfm.disableFormatHtml !== undefined) {
      disableFormatHtml = metadata.vfm.disableFormatHtml;
    }
    if (metadata.vfm.imgFigcaptionOrder !== undefined) {
      imgFigcaptionOrder = metadata.vfm.imgFigcaptionOrder;
    }
  }

  const processor = unified()
    .use(markdown(hardLineBreaks, math))
    .data('settings', { position: true })
    .use(html({ imgFigcaptionOrder }));

  if (replace) {
    processor.use(handleReplace, { rules: replace });
  }

  if (!partial) {
    processor.use(doc, metadata);
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
  metadata: Metadata = readMetadata(markdownString),
): string {
  const processor = VFM(options, metadata);
  const vfile = processor.processSync(markdownString);
  debug(vfile.data);
  return String(vfile);
}
