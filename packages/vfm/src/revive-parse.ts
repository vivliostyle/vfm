import unified from 'unified';
import markdown from 'remark-parse';
import math from 'remark-math';
import breaks from 'remark-breaks';

import {rubyParser as ruby} from './plugins/ruby';

export default [
  [markdown, {commonmark: true}],
  breaks,
  ruby,
  math,
] as unified.PluggableList<unified.Settings>;
