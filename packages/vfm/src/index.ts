import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified, { type Processor } from 'unified';
import type { SerializablePluginOptions } from './plugins/options.js';
import { type Metadata, readMetadata } from './plugins/metadata.js';
import { type ReplaceOptions, type ReplaceRule } from './plugins/replace.js';
import { reviveParse as markdown } from './revive-parse.js';
import { reviveRehype as html } from './revive-rehype.js';
import { debug } from './utils.js';

// Expose metadata reading by VFM
export * from './plugins/metadata.js';

// Re-export plugin brand types for downstream consumers that wish to refer to
// individual pipeline slots by their nominal identity.
export type {
  RemarkLineBreaksPlugin,
  RemarkMathPlugin,
  RemarkRubyPlugin,
  RemarkFootnotesPlugin,
  RemarkAttrPlugin,
  RemarkSlugPlugin,
  RemarkSectionPlugin,
  RemarkCodePlugin,
  RemarkTocPlugin,
  RemarkFrontmatterPlugin,
  RemarkInspectPlugin,
} from './revive-parse.js';
export type {
  RehypeRawPlugin,
  RehypeFigurePlugin,
  RehypeFootnotePlugin,
  RehypeReplacePlugin,
  RehypeDocumentPlugin,
  RehypeMathPlugin,
  RehypeFormatPlugin,
  RehypeInspectPlugin,
} from './revive-rehype.js';

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
} & SerializablePluginOptions &
  ReplaceOptions;

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

export type Plugins = ReturnType<typeof markdown> & ReturnType<typeof html>;

/**
 * Looser variant of {@link Plugins} returned by {@link EditPlugins}.
 * Consumers receive the strictly-typed `Plugins` as input — slot identity is
 * preserved via brand types — but are free to splice, drop, or extend the
 * plugin lists, so the return shape widens to ordinary pluggable lists.
 */
export type EditedPlugins = {
  mdastPlugins: ReadonlyArray<unified.Pluggable>;
  mdastToHastHandlers: Record<
    string,
    Plugins['mdastToHastHandlers'][keyof Plugins['mdastToHastHandlers']]
  >;
  hastPlugins: ReadonlyArray<unified.Pluggable>;
};

export type EditPlugins = (plugins: Plugins) => EditedPlugins;

/**
 * Create Unified processor for Markdown AST and Hypertext AST.
 * @param options Options.
 * @returns Unified processor.
 */
export function VFM(
  {
    style = undefined,
    partial,
    title = undefined,
    language = undefined,
    replace,
    hardLineBreaks,
    disableFormatHtml,
    math,
    imgFigcaptionOrder,
    assignIdToFigcaption,
    footnote,
  }: StringifyMarkdownOptions = {},
  metadata: Metadata = {},
  editPlugins: EditPlugins = (plugins) => plugins,
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

  const { mdastPlugins, mdastToHastHandlers, hastPlugins } = editPlugins({
    ...markdown({ hardLineBreaks, math }),
    ...html({
      imgFigcaptionOrder,
      assignIdToFigcaption,
      footnote,
      replace,
      partial,
      metadata,
      math,
      disableFormatHtml,
    }),
  });

  // `undefined` entries in toHastHandlers signal "use mdast-util-to-hast's
  // default handler"; strip them so remark-rehype's Object.assign-style merge
  // does not overwrite the defaults with undefined.
  const activeHandlers = Object.fromEntries(
    Object.entries(mdastToHastHandlers).filter(([, v]) => v !== undefined),
  );

  return unified()
    .data('settings', { position: true })
    .use([
      [remarkParse, { gfm: true, commonmark: true }],
      ...mdastPlugins,
      [
        remarkRehype,
        {
          allowDangerousHtml: true,
          handlers: activeHandlers,
        },
      ],
      ...hastPlugins,
      rehypeStringify,
    ]);
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
