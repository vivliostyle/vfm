import raw from 'rehype-raw';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import { handler as code } from './plugins/code.js';
import { hast as figure, FigureOptions } from './plugins/figure.js';
import { createFootnotePlugin, FootnoteOptions } from './plugins/footnotes.js';
import {
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
} from './plugins/math.js';
import { handler as ruby } from './plugins/ruby.js';
import { inspect } from './utils.js';

export type ReviveRehypeOptions = FigureOptions & FootnoteOptions;

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
  ] as unified.PluggableList<unified.Settings>;
};
