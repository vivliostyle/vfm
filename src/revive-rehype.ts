import raw from 'rehype-raw';
import slug from 'rehype-slug';
import remark2rehype from 'remark-rehype';
import unified from 'unified';
import {handler as figure} from './plugins/figure';
import {handler as ruby} from './plugins/ruby';
import {inspect} from './utils/debug';
import { plugin as math } from './plugins/math';

export default [
  [remark2rehype, {allowDangerousHtml: true, handlers: {ruby}}],
  raw,
  figure,
  math,
  slug,
  inspect('hast'),
] as unified.PluggableList<unified.Settings>;
