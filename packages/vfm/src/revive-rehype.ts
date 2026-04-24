import rehypeFormat from 'rehype-format';
import raw from 'rehype-raw';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import { handler as code } from './plugins/code.js';
import { mdast as doc } from './plugins/document.js';
import { hast as figure, type FigureOptions } from './plugins/figure.js';
import {
  createFootnotePlugin,
  type FootnoteOptions,
} from './plugins/footnotes.js';
import {
  hast as hastMath,
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
} from './plugins/math.js';
import type { Metadata } from './plugins/metadata.js';
import { replace, type ReplaceOptions } from './plugins/replace.js';
import { handler as ruby } from './plugins/ruby.js';
import { inspect } from './utils.js';

import type { StringifyMarkdownOptions } from './index.js';

export type ReviveRehypeOptions = { metadata: Metadata } & Pick<
  StringifyMarkdownOptions,
  'partial' | 'math' | 'disableFormatHtml'
> &
  FigureOptions &
  FootnoteOptions &
  ReplaceOptions;

/**
 * Create Hypertext AST handlers and transformers.
 * @param options Options for rehype transformers.
 * @returns Handlers and transformers.
 */
export const reviveRehype = (options?: ReviveRehypeOptions) => {
  const {
    toHastHandlers: footnoteHandlers,
    hastTransformers: footnoteTransformers,
  } = createFootnotePlugin(options);
  return [
    [
      remark2rehype,
      {
        allowDangerousHtml: true,
        handlers: {
          displayMath,
          inlineMath,
          ruby,
          code,
          ...footnoteHandlers,
        },
      },
    ],
    raw,
    [figure, options],
    ...footnoteTransformers,
    inspect('hast'),

    // inspectの前に実行すべきではと思うが一旦挙動の確認のため
    [replace, options],
    ...(options?.partial ? [] : [[doc, options?.metadata]]),
    // Must be run after `rehype-document` to write to `<head>`
    ...(options?.math ? [hastMath] : []),
    // Explicitly specify true if want unformatted HTML during development or debug
    ...(options?.disableFormatHtml ? [] : [rehypeFormat]),
  ] as unified.PluggableList<unified.Settings>;
};
