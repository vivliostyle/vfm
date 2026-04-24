import rehypeStringify from 'rehype-stringify';
import unified, { type Processor } from 'unified';
import type { DocumentOptions } from './plugins/document.js';
import type { FigureOptions } from './plugins/figure.js';
import type { FootnoteOptions } from './plugins/footnotes.js';
import type { FormatOptions } from './plugins/format.js';
import type { LineBreaksOptions } from './plugins/line-breaks.js';
import type { MathOptions } from './plugins/math.js';
import { type Metadata, readMetadata } from './plugins/metadata.js';
import { type ReplaceOptions, type ReplaceRule } from './plugins/replace.js';
import { reviveParse as markdown } from './revive-parse.js';
import { reviveRehype as html } from './revive-rehype.js';
import type { LaxPartial } from './types.js';
import { debug } from './utils.js';

// Expose metadata reading by VFM
export * from './plugins/metadata.js';

/**
 * Option for convert Markdown to a stringify (HTML).
 */
export type StringifyMarkdownOptions = {
  /** Custom stylesheet path/URL. */
  style?: string | string[] | undefined;
  /** Document title (ignored in partial mode). */
  title?: string | undefined;
  /** Document language (ignored in partial mode). */
  language?: string | undefined;
} & LaxPartial<
  LineBreaksOptions &
    MathOptions &
    Pick<DocumentOptions, 'partial'> &
    FormatOptions &
    FigureOptions &
    ReplaceOptions &
    FootnoteOptions
>;

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
    replace = [],
    hardLineBreaks = false,
    disableFormatHtml = false,
    math = true,
    imgFigcaptionOrder = 'img-figcaption',
    assignIdToFigcaption = false,
    footnote = undefined,
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
    if (metadata.vfm.assignIdToFigcaption !== undefined) {
      assignIdToFigcaption = metadata.vfm.assignIdToFigcaption;
    }
    if (metadata.vfm.footnote !== undefined) {
      footnote = metadata.vfm.footnote;
    }
  }

  return unified()
    .use(markdown({ hardLineBreaks, math }))
    .data('settings', { position: true })
    .use(
      html({
        imgFigcaptionOrder,
        assignIdToFigcaption,
        footnote,
        replace,
        partial,
        metadata,
        math,
        disableFormatHtml,
      }),
    )
    .use(rehypeStringify);
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
