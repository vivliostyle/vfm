import unified from 'unified';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import mathjax from 'rehype-mathjax';

import {rubyHandler as ruby} from './plugins/ruby';
import figure from './plugins/figure';

export default [
  [remark2rehype, {allowDangerousHtml: true, handlers: {ruby}}],
  raw,
  mathjax,
  figure,
] as unified.PluggableList<unified.Settings>;
