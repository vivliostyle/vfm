import rehypeRaw from 'rehype-raw';
import remarkRehype from 'remark-rehype';
import type { PluggableList } from 'unified';
import { handler as code } from './plugins/code.js';
import { hast as figure, type FigureOptions } from './plugins/figure.js';
import { createFootnotePlugin, type FootnoteOptions } from './plugins/footnotes.js';
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
      remarkRehype,
      {
        allowDangerousHtml: true,
        clobberPrefix: '',
        handlers: {
          displayMath,
          inlineMath,
          ruby,
          code,
          ...footnoteHandlers,
        },
      },
    ],
    rehypeRaw,
    [figure, options],
    ...footnoteTransformers,
    inspect('hast'),
  ] as PluggableList;
};
