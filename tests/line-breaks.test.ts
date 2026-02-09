import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils';

// remark-parse GFM seems to support only EOL two-spaces, so backslash is excluded.
test(
  'default: GFM (EOL two-spaces)',
  buildProcessorTestingCode(
    `a\nb  \nc`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "a\\nb"
        ├─1 break
        └─2 text "c"
    `,
    `<p>a\nb<br>\nc</p>`,
  ),
);

test(
  'optional: hard line breaks with GFM (EOL tow-spaces)',
  buildProcessorTestingCode(
    `a\nb  \nc`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "a\\nb"
        ├─1 break
        └─2 text "c"
    `,
    `<p>a<br>\nb<br>\nc</p>`,
    { hardLineBreaks: true },
  ),
);
