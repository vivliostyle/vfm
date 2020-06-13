import unified from 'unified';
import markdown from 'remark-parse';
import math from 'remark-math';

import {rubyParser} from './plugins/ruby';

export default [
  [markdown, {commonmark: true}],
  rubyParser,
  math,
] as unified.PluggableList<unified.Settings>;
