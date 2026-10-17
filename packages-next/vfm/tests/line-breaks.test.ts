import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils.js';

// remark-parse GFM seems to support only EOL two-spaces, so backslash is excluded.
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
    stripIndent`
    root[1]
    └─0 paragraph[5]
        ├─0 text "a"
        ├─1 break
        ├─2 text "b"
        ├─3 break
        └─4 text "c"
    `,
    stripIndent`
    <p>a<br>
    b<br>
    c</p>
    `,
    { hardLineBreaks: true },
  ),
);
