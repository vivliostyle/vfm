import * as v from 'valibot';
import { CodeOptionsSchema } from './code.js';
import { DocumentSerializableOptionsSchema } from './document.js';
import { FigureOptionsSchema } from './figure.js';
import { FootnoteOptionsSchema } from './footnotes.js';
import { FormatOptionsSchema } from './format.js';
import { LineBreaksOptionsSchema } from './line-breaks.js';
import { MathOptionsSchema } from './math.js';
import { RewriteLocalHrefExtensionsOptionsSchema } from './rewrite-local-href-extensions.js';

/**
 * Plugin options that can be expressed as serializable data.
 *
 * Excludes `ReplaceOptions` whose `match` callback is essential, since
 * stripping it would yield a useless type. Options whose function members are
 * only *optional customizations* (e.g. `FootnoteOptions` factories) remain
 * included; at boundaries where serialization is required (YAML frontmatter
 * etc.), apply `StripFunctions<>` to drop those callbacks while keeping the
 * declarative core intact.
 *
 * Used as the shared core between `StringifyMarkdownOptions` (programmatic
 * input) and `VFMSettings` (YAML-parsed input).
 */
export const SerializablePluginOptionsSchema = v.intersect([
  LineBreaksOptionsSchema,
  MathOptionsSchema,
  DocumentSerializableOptionsSchema,
  FormatOptionsSchema,
  FigureOptionsSchema,
  CodeOptionsSchema,
  FootnoteOptionsSchema,
  RewriteLocalHrefExtensionsOptionsSchema,
]);

export type SerializablePluginOptions = v.InferInput<
  typeof SerializablePluginOptionsSchema
>;
