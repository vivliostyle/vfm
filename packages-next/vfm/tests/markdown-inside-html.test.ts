import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils.js';

test(
  'allows markdown context in new paragraph',
  buildProcessorTestingCode(
    stripIndent`
    <div>

    **Markdown inside HTML**
    </div>
    `,
    stripIndent`
    root[3]
    ├─0 html "<div>"
    ├─1 paragraph[1]
    │   └─0 strong[1]
    │       └─0 text "Markdown inside HTML"
    └─2 html "</div>"
    `,
    stripIndent`
    <div>
    <p><strong>Markdown inside HTML</strong></p>
    </div>
    `,
  ),
);

test(
  'same paragraph',
  buildProcessorTestingCode(
    stripIndent`
    <div>
    **Markdown inside HTML**
    </div>
    `,
    stripIndent`
    root[1]
    └─0 html "<div>\\n**Markdown inside HTML**\\n</div>"
    `,
    stripIndent`
    <div>
    **Markdown inside HTML**
    </div>
    `,
  ),
);
