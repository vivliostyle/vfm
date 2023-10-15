import raw from 'rehype-raw';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import { handler as code } from './plugins/code';
import { hast as figure } from './plugins/figure';
import { hast as footnotes } from './plugins/footnotes';
import {
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
} from './plugins/math';
import { handler as ruby } from './plugins/ruby';
import { hast as waiAria } from './plugins/wai-aria-role';
import { inspect } from './utils';

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
  waiAria,
  inspect('hast'),
] as unified.PluggableList<unified.Settings>;
