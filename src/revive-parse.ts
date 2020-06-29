import breaks from 'remark-breaks';
import frontmatter from 'remark-frontmatter';
import math from 'remark-math';
import markdown from 'remark-parse';
import unified from 'unified';
import {attacher as code} from './plugins/code';
import {attacher as fencedBlock} from './plugins/fenced-block';
import {attacher as metadata} from './plugins/metadata';
import {attacher as ruby} from './plugins/ruby';
import {debug} from './utils/debug';

export default [
  [markdown, {commonmark: true}],
  frontmatter,
  metadata,
  fencedBlock,
  breaks,
  code,
  ruby,
  math,
  () => (tree) => {
    if (debug.enabled) {
      const inspect = require('unist-util-inspect');
      debug('\n### MDAST ###');
      debug(inspect(tree));
    }
  },
] as unified.PluggableList<unified.Settings>;
