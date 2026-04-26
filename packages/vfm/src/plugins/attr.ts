import attr from 'remark-attr';
import { partial } from '../utils.js';

export const mdast = partial(attr, {
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
    'fencedCode',
  ],
});
