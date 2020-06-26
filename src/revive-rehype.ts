import mathjax from 'rehype-mathjax';
import raw from 'rehype-raw';
import slug from 'rehype-slug';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import {handler as figure} from './plugins/figure';
import {handler as ruby} from './plugins/ruby';

export default [
  [remark2rehype, {allowDangerousHtml: true, handlers: {ruby}}],
  raw,
  mathjax,
  figure,
  slug,
] as unified.PluggableList<unified.Settings>;
