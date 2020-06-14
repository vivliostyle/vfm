import unified from 'unified';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import mathjax from 'rehype-mathjax';

import {handler as ruby} from './plugins/ruby';
import {handler as figure} from './plugins/figure';

export default [
  [remark2rehype, {allowDangerousHtml: true, handlers: {ruby}}],
  raw,
  mathjax,
  figure,
] as unified.PluggableList<unified.Settings>;
