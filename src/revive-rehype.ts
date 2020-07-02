import raw from 'rehype-raw';
import slug from 'rehype-slug';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import { handler as code } from './plugins/code';
import { plugin as figure } from './plugins/figure';
import { plugin as math } from './plugins/math';
import { handler as ruby } from './plugins/ruby';
import { inspect } from './utils/debug';

export default [
  [
    remark2rehype,
    {
      allowDangerousHtml: true,
      handlers: {
        ruby,
        code,
      },
    },
  ],
  raw,
  figure,
  math,
  slug,
  inspect('hast'),
] as unified.PluggableList<unified.Settings>;
