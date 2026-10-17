import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildHtmlTestingCode, buildProcessorTestingCode } from './utils.js';

test(
  'default: GFM (EOL two-spaces)',
  buildProcessorTestingCode(
    stripIndent`
    a
    b  
    c
    `,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "a\\nb"
        ├─1 break
        └─2 text "c"
    `,
    stripIndent`
    <p>a
    b<br>
    c</p>
    `,
  ),
);

test(
  'optional: hard line breaks with GFM (EOL tow-spaces)',
  buildProcessorTestingCode(
    stripIndent`
    a
    b  
    c
    `,
    // remark-breaks 4 is a transformer, so `parse()` still shows the soft
    // line break; the hard break appears in the HTML.
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "a\\nb"
        ├─1 break
        └─2 text "c"
    `,
    stripIndent`
    <p>a<br>
    b<br>
    c</p>
    `,
    { hardLineBreaks: true },
  ),
);

test(
  'default: backslash at the end of a line is also a hard break (CommonMark)',
  buildProcessorTestingCode(
    'a\\\nb',
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "a"
        ├─1 break
        └─2 text "b"
    `,
    '<p>a<br>\nb</p>',
  ),
);

// remark-breaks 4 replaces the line endings inside text nodes
// (mdast-util-newline-to-break) instead of re-tokenizing them, so the
// characters after the line ending are kept as they are. This fixes #186
// (full-width space) and #110 (no-break space), which remark-breaks 1 and the
// remark-parse 8 break tokenizer dropped.
test(
  'optional: keeps a full-width space after the hard line break (#186)',
  buildHtmlTestingCode(
    '　吾輩は猫である。名前はまだ無い。\n　どこで生れたかとんと見当がつかぬ。',
    '<p>　吾輩は猫である。名前はまだ無い。<br>\n　どこで生れたかとんと見当がつかぬ。</p>',
    { hardLineBreaks: true },
  ),
);

test(
  'keeps a no-break space after the line break (#110)',
  buildHtmlTestingCode(
    'AAA\\\n&nbsp;BBB\n\nCCC\n\u00a0DDD',
    '<p>AAA<br>\n\u00a0BBB</p>\n<p>CCC<br>\n\u00a0DDD</p>',
    { hardLineBreaks: true },
  ),
);

test(
  'optional: does not touch line endings inside inline code and math',
  buildHtmlTestingCode(
    '`a\nb` $x\ny$',
    '<p><code>a b</code> <span class="math inline" data-math-typeset="true">\\(x\ny\\)</span></p>',
    { hardLineBreaks: true, math: true },
  ),
);
