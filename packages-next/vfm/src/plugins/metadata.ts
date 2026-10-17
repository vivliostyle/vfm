import type { Element } from 'hast';
import { JSON_SCHEMA, load as yaml } from 'js-yaml';
import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { Shortcode } from './toc.js';
import stringify from 'rehype-stringify';
import frontmatter from 'remark-frontmatter';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import type { Node } from 'unist';
import { select } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import * as v from 'valibot';
import { debug } from '../utils.js';
import { mdast as attr } from './attr.js';
import { DocumentSerializableOptionsSchema } from './document.js';
import {
  FigcaptionInlineOptionsSchema,
  FigureOptionsSchema,
} from './figure.js';
import { mdast as footnotes, YamlFootnoteOptionsSchema } from './footnotes.js';
import { FormatOptionsSchema } from './format.js';
import { LineBreaksOptionsSchema } from './line-breaks.js';
import { MathOptionsSchema } from './math.js';
import { RewriteRelativeHrefExtensionsOptionsSchema } from './rewrite-relative-href-extensions.js';
import { YamlTableOptionsSchema } from './table.js';

/** Attribute of HTML tag. */
export type Attribute = {
  /** Name. */
  name: string;
  /** Value. */
  value: string;
};

/** Schema for the `vfm:` field of YAML frontmatter. */
export const VFMSettingsSchema = v.intersect([
  LineBreaksOptionsSchema,
  MathOptionsSchema,
  DocumentSerializableOptionsSchema,
  FormatOptionsSchema,
  FigureOptionsSchema,
  FigcaptionInlineOptionsSchema,
  YamlFootnoteOptionsSchema,
  RewriteRelativeHrefExtensionsOptionsSchema,
  YamlTableOptionsSchema,
  v.object({
    theme: v.optional(v.pipe(v.string(), v.description('Path of theme.'))),
    toc: v.optional(v.pipe(v.boolean(), v.description('Enable TOC mode.'))),
  }),
]);

/** Settings of VFM. */
export type VFMSettings = v.InferInput<typeof VFMSettingsSchema>;

/** Metadata from Frontmatter. */
export type Metadata = {
  /** Value of `<html id="...">`. */
  id?: string | undefined;
  /** Value of `<html lang="...">`. */
  lang?: string | undefined;
  /** Value of `<html dir="...">`. e.g. `ltr`, `rtl`, `auto`. */
  dir?: string | undefined;
  /** Value of `<html class="...">`. */
  class?: string | undefined;
  /** Value of `<title>...</title>`. */
  title?: string | undefined;
  /**
   * Attributes of `<html>`.
   * The `id`,` lang`, `dir`, and` class` specified in the root take precedence over the value of this property.
   */
  html?: Array<Attribute> | undefined;
  /** Attributes of `<body>`. */
  body?: Array<Attribute> | undefined;
  /** Attributes of `<base>`. */
  base?: Array<Attribute> | undefined;
  /** Attribute collection of `<meta>`. */
  meta?: Array<Array<Attribute>> | undefined;
  /** Attribute collection of `<link>`. */
  link?: Array<Array<Attribute>> | undefined;
  /** Attribute collection of `<script>`. */
  script?: Array<Array<Attribute>> | undefined;
  /** VFM settings. */
  vfm?: VFMSettings | undefined;
  /** `<style>...</style>`, reserved for future use. */
  style?: string | undefined;
  /** `<head>...</head>`, reserved for future use. */
  head?: string | undefined;

  /**
   * A set of key-value pairs that are specified in `readMetadata` not to be processed as `<meta>`.
   * The data types converted from Frontmatter's YAML are retained.
   * Use this if want to add custom metadata with a third party tool.
   */
  custom?:
    | {
        [key: string]: any;
      }
    | undefined;
};

/**
 * Extension of VFM metadata to VFile data.
 */
interface MetadataVFile extends VFile {
  data: any;
}

/**
 * Read the title from heading without footnotes.
 * @param tree Tree of Markdown AST.
 * @returns Title text or `undefined`.
 */
const readTitleFromHeading = (tree: Node): string | undefined => {
  const heading = select('heading', tree) as Element | undefined;
  if (!heading) {
    return;
  }

  // Create title string with footnotes removed
  const children = [...heading.children];
  heading.children = heading.children.filter(
    (child: Node) => child.type !== 'footnote',
  );
  // Remove ruby text and HTML tags
  const text = toString(heading)
    .replace(/{(.+?)(?<=[^\\|])\|(.+?)}/g, '$1')
    .replace(/<[^<>]*>/g, '');
  heading.children = children;

  return text;
};

/**
 * Parse Markdown's Frontmatter to metadate (`VFile.data`).
 * @returns Handler.
 * @see https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-meta/src/index.js
 */
const mdast = () => (tree: Node, file: MetadataVFile) => {
  visit(tree as Root, 'yaml', (node) => {
    const value = yaml(node.value, { schema: JSON_SCHEMA });
    if (typeof value === 'object') {
      file.data = {
        ...file.data,
        ...value,
      };
    }
  });

  // If title is undefined in frontmatter, read from heading
  if (!file.data.title) {
    const title = readTitleFromHeading(tree);
    if (title) {
      file.data.title = title;
    }
  }

  visit(tree as Root, 'shortcode', (node: Shortcode) => {
    if (node.identifier !== 'toc') {
      return;
    }

    if (file.data.vfm) {
      file.data.vfm.toc = true;
    } else {
      file.data.vfm = { math: true, toc: true };
    }
  });
};

/**
 * Parse Markdown frontmatter.
 * @param md Markdown.
 * @returns Key/Value pair.
 */
const parseMarkdown = (md: string): KeyValue => {
  const processor = unified()
    .use([
      [markdown, { gfm: true, commonmark: true }],
      // Remove footnotes when reading title from heading
      footnotes,
      attr,
      frontmatter,
      mdast,
    ] as unified.PluggableList<unified.Settings>)
    .data('settings', { position: false })
    .use(remark2rehype)
    .use(stringify);

  return processor.processSync(md).data as KeyValue;
};

/**
 * Read the string or null value in the YAML parse result.
 * If the value is null, it will be an empty string
 * @param value Value of YAML parse result.
 * @returns Text.
 */
const readStringOrNullValue = (value: string | null): string => {
  return value === null ? '' : `${value}`;
};

/**
 * Read an attributes from data object.
 * @param data Data object.
 * @returns Attributes of HTML tag.
 */
const readAttributes = (data: any): Array<Attribute> | undefined => {
  if (data === null || typeof data !== 'object') {
    return;
  }

  const result: Array<Attribute> = [];
  for (const key of Object.keys(data)) {
    result.push({ name: key, value: readStringOrNullValue(data[key]) });
  }

  return result;
};

/**
 * Read an attributes collection from data object.
 * @param data Data object.
 * @returns Attributes collection of HTML tag.
 */
const readAttributesCollection = (
  data: any,
): Array<Array<Attribute>> | undefined => {
  if (!Array.isArray(data)) {
    return;
  }

  const result: Array<Array<Attribute>> = [];
  data.forEach((value) => {
    const attributes = readAttributes(value);
    if (attributes) {
      result.push(attributes);
    }
  });

  return result;
};

/**
 * Walk an `intersect`-of-`object` schema and collect every field's schema
 * into a single map. Used by {@link readSettings} to validate the `vfm:`
 * block one entry at a time so a single invalid value does not discard
 * unrelated valid options.
 *
 * @remarks
 * Reads `schema.type`, `schema.entries`, and `schema.options` directly,
 * which are valibot internals rather than a documented public API. The
 * shapes have been stable across valibot 1.x; if a future major changes
 * them, this function fails closed (returns `{}`) and `readSettings`
 * silently accepts everything as `undefined`. The `valibot` dependency
 * should stay pinned to `^1.x` for this reason. An alternative is to
 * build the per-field map explicitly from the same plugin schema imports
 * that compose `VFMSettingsSchema`, at the cost of duplicated maintenance.
 */
const collectObjectEntries = (
  schema: v.GenericSchema<unknown>,
): Record<string, v.GenericSchema<unknown>> => {
  const s = schema as { type: string; entries?: unknown; options?: unknown[] };
  if (s.type === 'object' && s.entries) {
    return s.entries as Record<string, v.GenericSchema<unknown>>;
  }
  if (s.type === 'intersect' && Array.isArray(s.options)) {
    return Object.assign(
      {},
      ...s.options.map((inner) =>
        collectObjectEntries(inner as v.GenericSchema<unknown>),
      ),
    );
  }
  return {};
};

const vfmSettingsEntries = collectObjectEntries(
  VFMSettingsSchema as v.GenericSchema<unknown>,
);

/**
 * Read VFM settings from a frontmatter object. Validates per entry: an
 * invalid field is dropped (its default applies) without discarding the
 * other valid fields.
 */
const readSettings = (data: unknown): VFMSettings => {
  const defaults: VFMSettings = {
    toc: false,
    assignIdToFigcaption: false,
    captionlessImagePolicy: undefined,
    footnote: undefined,
  };
  if (data === null || typeof data !== 'object') {
    return defaults;
  }
  const obj = data as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...defaults };
  for (const [key, fieldSchema] of Object.entries(vfmSettingsEntries)) {
    if (!(key in obj)) continue;
    const r = v.safeParse(fieldSchema, obj[key]);
    if (r.success) {
      merged[key] = r.output;
    } else {
      debug('vfm.%s: invalid value, ignoring: %o', key, r.issues);
    }
  }
  return merged as VFMSettings;
};

/**
 * Read metadata from Markdown frontmatter.
 *
 * Keys that are not defined as VFM are treated as `meta`. If you specify a key name in `customKeys`, the key and its data type will be preserved and stored in `custom` instead of `meta`.
 * @param md Markdown.
 * @param customKeys A collection of key names to be ignored by meta processing.
 * @returns Metadata.
 */
export const readMetadata = (
  md: string,
  customKeys: string[] = [],
): Metadata => {
  const metadata: Metadata = {};
  const data = parseMarkdown(md);
  const others: Array<Array<Attribute>> = [];

  for (const key of Object.keys(data)) {
    if (customKeys.includes(key)) {
      if (!metadata.custom) {
        metadata.custom = {};
      }

      metadata.custom[key] = data[key];
      continue;
    }

    switch (key) {
      case 'id':
      case 'lang':
      case 'dir':
      case 'class':
      case 'title':
        metadata[key] = readStringOrNullValue(data[key]);
        break;

      case 'html':
      case 'body':
      case 'base':
        metadata[key] = readAttributes(data[key]);
        break;

      case 'meta':
      case 'link':
      case 'script':
        metadata[key] = readAttributesCollection(data[key]);
        break;

      case 'vfm':
        metadata[key] = readSettings(data[key]);
        break;

      case 'style':
      case 'head':
        // Reserved for future use.
        break;

      default:
        others.push([
          { name: 'name', value: key },
          { name: 'content', value: readStringOrNullValue(data[key]) },
        ]);
        break;
    }
  }

  // Other properties should be `<meta>`
  if (0 < others.length) {
    metadata.meta = metadata.meta ? metadata.meta.concat(others) : others;
  }

  return metadata;
};
