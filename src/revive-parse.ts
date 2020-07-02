import breaks from 'remark-breaks';
import footnotes from 'remark-footnotes';
import frontmatter from 'remark-frontmatter';
import math from 'remark-math';
import markdown from 'remark-parse';
import unified from 'unified';
import { attacher as code } from './plugins/code';
import { attacher as fencedBlock } from './plugins/fenced-block';
import { plugin as metadata } from './plugins/metadata';
import { attacher as ruby } from './plugins/ruby';
import { plugin as toc } from './plugins/toc';
import { inspect } from './utils/debug';

export default [
  [markdown, { gfm: true, commonmark: true }],
  fencedBlock,
  breaks,
  [footnotes, { inlineNotes: true }],
  code,
  ruby,
  math,
  toc,
  frontmatter,
  metadata,
  inspect('mdast'),
] as unified.PluggableList<unified.Settings>;
