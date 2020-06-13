import unified from 'unified';
import markdown from 'remark-parse';
import math from 'remark-math';

import {rubyParser as ruby} from './plugins/ruby';

export default [
  [markdown, {commonmark: true}],
  ruby,
  math,
] as unified.PluggableList<unified.Settings>;
