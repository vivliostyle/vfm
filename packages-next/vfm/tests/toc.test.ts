import { expect, test } from 'vitest';
import { parseShortcodeAttributes } from '../src/plugins/toc.js';
import { buildHtmlTestingCode, buildProcessorTestingCode } from './utils.js';

// `[[toc]]` is kept as a `shortcode` node and renders as an empty `<div>`,
// which is what remark-shortcodes + the unknown-node handler produced. The
// future of the feature is decided in #207.

test(
  '[[toc]]',
  buildProcessorTestingCode(
    '[[toc]]',
    `
root[1]
└─0 shortcode
      identifier: "toc"
      attributes: {}
`,
    '<div></div>',
  ),
);

test(
  '[[toc]] with attributes, followed by a paragraph',
  buildProcessorTestingCode(
    '[[toc id="toc"]]\n目次？',
    `
root[2]
├─0 shortcode
│     identifier: "toc"
│     attributes: {"id":"toc"}
└─1 paragraph[1]
    └─0 text "目次？"
`,
    '<div></div>\n<p>目次？</p>',
  ),
);

test(
  'whitespace around the identifier and the attributes',
  buildProcessorTestingCode(
    '  [[ toc  a="x]]y" b=\'2\' c=3 ]]  ',
    `
root[1]
└─0 shortcode
      identifier: "toc"
      attributes: {"a":"x]]y","b":"2","c":"3"}
`,
    '<div></div>',
  ),
);

test(
  'shortcodes other than toc are parsed and then removed',
  buildProcessorTestingCode(
    '[[foobar]]',
    `
root[1]
└─0 shortcode
      identifier: "foobar"
      attributes: {}
`,
    '',
  ),
);

test(
  '[[toc]] between sections',
  buildHtmlTestingCode(
    '# h\n\n[[toc]]\n\n## h2',
    '<section class="level1"><h1 id="h">h</h1><div></div><section class="level2"><h2 id="h2">h2</h2></section></section>',
  ),
);

test.each([
  ['text after the closer', '[[toc]] text', '<p>[[toc]] text</p>'],
  ['inline position', 'text [[toc]]', '<p>text [[toc]]</p>'],
  ['does not interrupt a paragraph', 'text\n[[toc]]', '<p>text\n[[toc]]</p>'],
  ['empty', '[[]]', '<p>[[]]</p>'],
  ['whitespace only', '[[ ]]', '<p>[[ ]]</p>'],
  ['multi-line', '[[toc\n]]', '<p>[[toc\n]]</p>'],
  ['unclosed', '[[toc', '<p>[[toc</p>'],
])('not a shortcode: %s', (_, md, html) => {
  buildHtmlTestingCode(md, html)();
});

test(
  'definitions starting with [ still work',
  buildHtmlTestingCode(
    '[^1]: note\n\n[a]: http://x\n\n[[a]]: http://y',
    '<p>[<a href="http://x">a</a>]: <a href="http://y">http://y</a></p>',
  ),
);

test('parseShortcodeAttributes', () => {
  expect(parseShortcodeAttributes('')).toStrictEqual({});
  expect(parseShortcodeAttributes(' a="b"  c=\'d\' e=f ')).toStrictEqual({
    a: 'b',
    c: 'd',
    e: 'f',
  });
  expect(
    parseShortcodeAttributes('data-x="1 2" ="skipped" ]junk'),
  ).toStrictEqual({
    'data-x': '1 2',
  });
});
