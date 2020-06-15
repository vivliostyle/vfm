import unified from 'unified';
import markdown from 'remark-parse';
import math from 'remark-math';
import breaks from 'remark-breaks';

import {attacher as ruby} from './plugins/ruby';
import {attacher as fencedBlock} from './plugins/fenced-block';

export default [
  [markdown, {commonmark: true}],
  fencedBlock,
  breaks,
  ruby,
  math,
] as unified.PluggableList<unified.Settings>;
