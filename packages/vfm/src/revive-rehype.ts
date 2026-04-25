import raw from 'rehype-raw';
import unified from 'unified';
import { handler as code } from './plugins/code.js';
import { mdast as doc, type DocumentOptions } from './plugins/document.js';
import { hast as figure, type FigureOptions } from './plugins/figure.js';
import {
  createFootnotePlugin,
  type FootnoteOptions,
} from './plugins/footnotes.js';
import { hast as format, type FormatOptions } from './plugins/format.js';
import {
  hast as math,
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
  type MathOptions,
} from './plugins/math.js';
import { replace, type ReplaceOptions } from './plugins/replace.js';
import { handler as ruby } from './plugins/ruby.js';
import { inspect } from './utils.js';

export type ReviveRehypeOptions = FigureOptions &
  FootnoteOptions &
  ReplaceOptions &
  DocumentOptions &
  MathOptions &
  FormatOptions;

/**
 * Create Hypertext AST handlers and transformers.
 * @param options Options for rehype transformers.
 * @returns Handlers and transformers.
 */
export const reviveRehype = (options: ReviveRehypeOptions) => {
  const {
    toHastHandlers: footnoteHandlers,
    hastTransformer: footnoteTransformer,
  } = createFootnotePlugin(options);
  return {
    toHastHandlers: {
      displayMath,
      inlineMath,
      ruby,
      code,
      ...footnoteHandlers,
    } as const,
    hastPlugins: [
      raw,
      [figure, options],
      footnoteTransformer,
      [replace, options],
      [doc, options],
      // Must be run after `rehype-document` to write to `<head>`
      [math, options],
      // Explicitly specify true if want unformatted HTML during development or debug
      [format, options],
      inspect('hast'),
    ] as unified.PluggableList<unified.Settings>,
  };
};
