import attr from 'remark-attr';
import breaks from 'remark-breaks';
import footnotes from 'remark-footnotes';
import frontmatter from 'remark-frontmatter';
import math from 'remark-math';
import markdown from 'remark-parse';
import slug from 'remark-slug';
import unified from 'unified';
import { attacher as code } from './plugins/code';
import { attacher as fencedBlock } from './plugins/fenced-block';
import { plugin as metadata } from './plugins/metadata';
import { attacher as ruby } from './plugins/ruby';
import { plugin as section } from './plugins/section';
import { plugin as toc } from './plugins/toc';
import { inspect } from './utils/debug';

export default [
  [markdown, { gfm: true, commonmark: true }],
  fencedBlock,
  ruby,
  breaks,
  [footnotes, { inlineNotes: true }],
  math,
  [
    attr,
    {
      enableAtxHeaderInline: true,
      scope: 'permissive',
      elements: [
        'link',
        'atxHeading',
        'strong',
        'emphasis',
        'code',
        'deletion',
        'reference',
        'footnoteCall',
        'autoLink',
      ],
    },
  ],
  slug,
  section,
  code,
  toc,
  frontmatter,
  metadata,
  inspect('mdast'),
] as unified.PluggableList<unified.Settings>;
