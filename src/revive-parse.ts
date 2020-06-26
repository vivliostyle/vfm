import breaks from 'remark-breaks';
import frontmatter from 'remark-frontmatter';
import math from 'remark-math';
import markdown from 'remark-parse';
import unified from 'unified';
import {attacher as fencedBlock} from './plugins/fenced-block';
import {attacher as metadata} from './plugins/metadata';
import {attacher as ruby} from './plugins/ruby';

export default [
  [markdown, {commonmark: true}],
  fencedBlock,
  breaks,
  ruby,
  math,
  frontmatter,
  metadata,
] as unified.PluggableList<unified.Settings>;
