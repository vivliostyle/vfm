import type { DocumentOptions } from './document.js';
import type { FigureOptions } from './figure.js';
import type { FootnoteOptions } from './footnotes.js';
import type { FormatOptions } from './format.js';
import type { LineBreaksOptions } from './line-breaks.js';
import type { MathOptions } from './math.js';

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
export type SerializablePluginOptions = LineBreaksOptions &
  MathOptions &
  Pick<DocumentOptions, 'partial'> &
  FormatOptions &
  FigureOptions &
  FootnoteOptions;
