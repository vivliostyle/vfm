<<<<<<< HEAD
import * as v from 'valibot';
import { DocumentSerializableOptionsSchema } from './document.js';
import { FigureOptionsSchema } from './figure.js';
import { FootnoteOptionsSchema } from './footnotes.js';
import { FormatOptionsSchema } from './format.js';
import { LineBreaksOptionsSchema } from './line-breaks.js';
import { MathOptionsSchema } from './math.js';
=======
import type { CodeOptions } from './code.js';
import type { DocumentOptions } from './document.js';
import type { FigureOptions } from './figure.js';
import type { FootnoteOptions } from './footnotes.js';
import type { FormatOptions } from './format.js';
import type { LineBreaksOptions } from './line-breaks.js';
import type { MathOptions } from './math.js';
>>>>>>> origin/main

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
<<<<<<< HEAD
export const SerializablePluginOptionsSchema = v.intersect([
  LineBreaksOptionsSchema,
  MathOptionsSchema,
  DocumentSerializableOptionsSchema,
  FormatOptionsSchema,
  FigureOptionsSchema,
  FootnoteOptionsSchema,
]);

export type SerializablePluginOptions = v.InferInput<
  typeof SerializablePluginOptionsSchema
>;
=======
export type SerializablePluginOptions = LineBreaksOptions &
  MathOptions &
  Pick<DocumentOptions, 'partial'> &
  FormatOptions &
  FigureOptions &
  CodeOptions &
  FootnoteOptions;
>>>>>>> origin/main
