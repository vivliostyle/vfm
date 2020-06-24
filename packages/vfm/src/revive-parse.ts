import unified from 'unified';
import markdown from 'remark-parse';
import math from 'remark-math';
import breaks from 'remark-breaks';
import frontmatter from 'remark-frontmatter';

import {attacher as ruby} from './plugins/ruby';
import {attacher as fencedBlock} from './plugins/fenced-block';
import {attacher as metadata} from './plugins/metadata';

export default [
  [markdown, {commonmark: true}],
  fencedBlock,
  breaks,
  ruby,
  math,
  frontmatter,
  metadata,
] as unified.PluggableList<unified.Settings>;
