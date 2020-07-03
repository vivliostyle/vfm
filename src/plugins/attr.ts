import attr from 'remark-attr';

export const mdast = [
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
];
