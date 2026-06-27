import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified, { type Processor } from 'unified';
import * as v from 'valibot';
import { SerializablePluginOptionsSchema } from './plugins/options.js';
import { type Metadata, readMetadata } from './plugins/metadata.js';
import { ReplaceOptionsSchema, type ReplaceRule } from './plugins/replace.js';
import { reviveParse as markdown } from './revive-parse.js';
import { reviveRehype as html } from './revive-rehype.js';
import { debug, inspect } from './utils.js';

// Expose metadata reading by VFM
export * from './plugins/metadata.js';

// Re-export per-plugin schemas + their derived types so downstream consumers
// (e.g. vivliostyle-cli's config schema) can compose VFM options through the
// same source-of-truth schemas this package validates against internally.
export {
  LineBreaksOptionsSchema,
  type LineBreaksOptions,
} from './plugins/line-breaks.js';
export { MathOptionsSchema, type MathOptions } from './plugins/math.js';
export { FormatOptionsSchema, type FormatOptions } from './plugins/format.js';
export { CodeOptionsSchema, type CodeOptions } from './plugins/code.js';
export {
  ImgFigcaptionOrderSchema,
  CaptionlessImagePolicySchema,
  FigureOptionsSchema,
  FigcaptionInlineOptionsSchema,
  type ImgFigcaptionOrder,
  type CaptionlessImagePolicy,
  type FigureOptions,
  type FigcaptionInlineOptions,
} from './plugins/figure.js';
export {
  DocumentSerializableOptionsSchema,
  type DocumentOptions,
} from './plugins/document.js';
export {
  FootnoteModeSchema,
  FootnoteOptionsSchema,
  YamlFootnoteOptionsSchema,
  type FootnoteMode,
  type FootnoteOptions,
  type YamlFootnoteOptions,
  type DpubCallFactory,
  type DpubBodyFactory,
  type GcpmBodyFactory,
  type GcpmDuplicatedCallFactory,
} from './plugins/footnotes.js';
export {
  ReplaceRuleSchema,
  ReplaceOptionsSchema,
  type ReplaceRule,
  type ReplaceOptions,
} from './plugins/replace.js';
export {
  RewriteRelativeHrefExtensionsOptionsSchema,
  type RewriteRelativeHrefExtensionsOptions,
} from './plugins/rewrite-relative-href-extensions.js';
export {
  TableCellPresetSchema,
  TableOptionsSchema,
  YamlTableOptionsSchema,
  type TableCellAlign,
  type TableCellContext,
  type TableCellFactory,
  type TableCellHook,
  type TableCellPreset,
  type TableOptions,
  type YamlTableOptions,
} from './plugins/table.js';
export {
  SerializablePluginOptionsSchema,
  type SerializablePluginOptions,
} from './plugins/options.js';

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
} from './revive-parse.js';
export type {
  RehypeRawPlugin,
  RehypeFootnotePlugin,
  RehypeReplacePlugin,
  RehypeDocumentPlugin,
  RehypeMathPlugin,
  RehypeFormatPlugin,
  RehypeRewriteRelativeHrefExtensionsPlugin,
} from './revive-rehype.js';

// The raw intersect schema. Kept internal so its inferred TS type does not
// leak `.pnpm/...` paths through pnpm-isolated downstream installs. The
// public `StringifyMarkdownOptionsSchema` below is annotated with the
// nominal `StringifyMarkdownOptions` interface to keep TS d.ts emit
// portable (TS2742).
const _stringifyMarkdownOptionsSchema = v.intersect([
  v.object({
    style: v.optional(
      v.pipe(
        v.union([v.string(), v.array(v.string())]),
        v.description('Custom stylesheet path/URL.'),
      ),
    ),
    title: v.optional(
      v.pipe(
        v.string(),
        v.description('Document title (ignored in partial mode).'),
      ),
    ),
    language: v.optional(
      v.pipe(
        v.string(),
        v.description('Document language (ignored in partial mode).'),
      ),
    ),
    editPlugins: v.optional(
      v.pipe(
        v.function() as v.GenericSchema<EditPlugins>,
        v.metadata({
          typeString: '(plugins: BuiltinPlugins) => EditedPlugins',
        }),
        v.description(
          'Edit the plugin lists assembled by VFM before they are used. Only head-prepend and tail-append to the built-in lists are behaviorally stable across minor releases.',
        ),
      ),
    ),
  }),
  SerializablePluginOptionsSchema,
  ReplaceOptionsSchema,
]);

/**
 * Option for convert Markdown to a stringify (HTML).
 *
 * Declared as `interface` so that downstream consumers (e.g.
 * vivliostyle-cli) see a stable nominal name instead of
 * `v.InferInput<typeof StringifyMarkdownOptionsSchema>`. The latter form
 * causes TypeScript to expand the schema's structural shape during
 * declaration emit and pulls non-portable `.pnpm/...` paths through pnpm
 * isolated installs (TS2742). The compile-time check below pins this
 * interface to the schema, so a drift in either direction is rejected.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the empty body is intentional; see the JSDoc above for rationale.
export interface StringifyMarkdownOptions extends v.InferInput<
  typeof _stringifyMarkdownOptionsSchema
> {}

/** Schema for {@link StringifyMarkdownOptions}. */
export const StringifyMarkdownOptionsSchema: v.GenericSchema<StringifyMarkdownOptions> =
  _stringifyMarkdownOptionsSchema;

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
 * Plugin lists VFM hands to {@link EditPlugins} so callers can splice
 * their own plugins around the built-in ones.
 *
 * The branded slot types (e.g. {@link RehypeReplacePlugin}) are
 * self-documentation: they let `editPlugins` code refer to a built-in
 * plugin by a stable nominal name at the moment of writing. They do
 * not constitute a SemVer stability contract over the slot inventory
 * or order. VFM may reorder, remove, or insert built-in slots in any
 * minor or patch release without treating it as a breaking change.
 */
export type BuiltinPlugins = ReturnType<typeof markdown> &
  ReturnType<typeof html>;

/**
 * Looser variant of {@link BuiltinPlugins} returned by {@link EditPlugins}.
 * Consumers receive the strictly typed `BuiltinPlugins` as input (the
 * branded slot types let callers identify each built-in by name), but
 * are free to splice, drop, or extend the plugin lists, so the return
 * shape widens to ordinary pluggable lists.
 */
export type EditedPlugins = {
  mdastPlugins: ReadonlyArray<unified.Pluggable>;
  mdastToHastHandlers: Record<
    string,
    BuiltinPlugins['mdastToHastHandlers'][keyof BuiltinPlugins['mdastToHastHandlers']]
  >;
  hastPlugins: ReadonlyArray<unified.Pluggable>;
};

export type EditPlugins = (plugins: BuiltinPlugins) => EditedPlugins;

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
    captionlessImagePolicy,
    parseFigcaptionAsInline,
    footnote,
    rewriteRelativeHrefExtensions,
    table,
    editPlugins = (plugins) => plugins,
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
    if (metadata.vfm.captionlessImagePolicy !== undefined) {
      captionlessImagePolicy = metadata.vfm.captionlessImagePolicy;
    }
    if (metadata.vfm.parseFigcaptionAsInline !== undefined) {
      parseFigcaptionAsInline = metadata.vfm.parseFigcaptionAsInline;
    }
    if (metadata.vfm.footnote !== undefined) {
      footnote = metadata.vfm.footnote;
    }
    if (metadata.vfm.rewriteRelativeHrefExtensions !== undefined) {
      rewriteRelativeHrefExtensions =
        metadata.vfm.rewriteRelativeHrefExtensions;
    }
    if (metadata.vfm.table !== undefined) {
      table = metadata.vfm.table;
    }
  }

  const { mdastPlugins, mdastToHastHandlers, hastPlugins } = editPlugins({
    ...markdown({ hardLineBreaks, math, parseFigcaptionAsInline }),
    ...html({
      imgFigcaptionOrder,
      assignIdToFigcaption,
      captionlessImagePolicy,
      parseFigcaptionAsInline,
      footnote,
      replace,
      partial,
      metadata,
      math,
      disableFormatHtml,
      rewriteRelativeHrefExtensions,
      table,
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
      inspect('mdast'),
      [
        remarkRehype,
        {
          allowDangerousHtml: true,
          handlers: activeHandlers,
        },
      ],
      ...hastPlugins,
      inspect('hast'),
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
