import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils';

it(
  'simple code',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: null
    `,
    `<pre class="language-js"><code class="language-js"><span class="token string">'Hello code'</span></code></pre>`,
  ),
);

it(
  'code with title',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js:app.js
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js:app.js"
          meta: null
    `,
    `<figure class="language-js"><figcaption>app.js</figcaption><pre class="language-js"><code class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

it(
  'code with extra metadata',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js x=1 title=app.js
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "x=1 title=app.js"
    `,
    `<figure class="language-js"><figcaption>app.js</figcaption><pre class="language-js"><code class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);
