import mathjax from 'rehype-mathjax';
import raw from 'rehype-raw';
import slug from 'rehype-slug';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import {handler as figure} from './plugins/figure';
import {handler as ruby} from './plugins/ruby';
import {debug} from './utils/debug';

export default [
  [remark2rehype, {allowDangerousHtml: true, handlers: {ruby}}],
  raw,
  mathjax,
  figure,
  slug,
  () => (tree) => {
    if (debug.enabled) {
      const inspect = require('unist-util-inspect');
      debug('\n### HAST ###');
      debug(inspect(tree));
    }
  },
] as unified.PluggableList<unified.Settings>;
