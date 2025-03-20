import raw from 'rehype-raw';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import { handler as code } from './plugins/code.js';
import { hast as figure } from './plugins/figure.js';
import { hast as footnotes } from './plugins/footnotes.js';
import {
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
} from './plugins/math.js';
import { handler as ruby } from './plugins/ruby.js';
import { inspect } from './utils.js';

/**
 * Create Hypertext AST handlers and transformers.
 * @param enableMath Enable math syntax.
 * @returns Handlers and transformers.
 */
export const reviveRehype = [
  [
    remark2rehype,
    {
      allowDangerousHtml: true,
      handlers: {
        displayMath,
        inlineMath,
        ruby,
        code,
      },
    },
  ],
  raw,
  figure,
  footnotes,
  inspect('hast'),
] as unified.PluggableList<unified.Settings>;
