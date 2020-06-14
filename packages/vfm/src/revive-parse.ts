import unified from 'unified';
import markdown from 'remark-parse';
import math from 'remark-math';
import breaks from 'remark-breaks';

import {rubyParser as ruby} from './plugins/ruby';
import {parser as fencedBlock} from './plugins/fencedBlock';

export default [
  [markdown, {commonmark: true}],
  fencedBlock,
  breaks,
  ruby,
  math,
] as unified.PluggableList<unified.Settings>;
