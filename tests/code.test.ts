import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils';

test(
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

test(
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

test(
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

test(
  'code with id attribute',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js {#code-id}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "{#code-id}"
    `,
    `<pre class="language-js"><code id="code-id" class="language-js"><span class="token string">'Hello code'</span></code></pre>`,
  ),
);

test(
  'code with title and id attribute',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js:app.js {#code-id}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js:app.js"
          meta: "{#code-id}"
    `,
    `<figure class="language-js"><figcaption>app.js</figcaption><pre class="language-js"><code id="code-id" class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

test(
  'code with multiple attributes',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js {#code-id .highlight data-line="1"}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "{#code-id .highlight data-line=\\"1\\"}"
    `,
    `<pre class="language-js"><code id="code-id" class="language-js highlight" data-line="1"><span class="token string">'Hello code'</span></code></pre>`,
  ),
);

test(
  'code with title metadata and id attribute',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js title=app.js {#code-id}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "title=app.js {#code-id}"
    `,
    `<figure class="language-js"><figcaption>app.js</figcaption><pre class="language-js"><code id="code-id" class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

test(
  'code with brace in title value',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js title={App}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "title={App}"
    `,
    `<figure class="language-js"><figcaption>{App}</figcaption><pre class="language-js"><code class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

test(
  'code with brace in title value and id attribute',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js title={App} {#code-id}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "title={App} {#code-id}"
    `,
    `<figure class="language-js"><figcaption>{App}</figcaption><pre class="language-js"><code id="code-id" class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

test(
  'code with attr-like brace in title value',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js title={#my-id}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "title={#my-id}"
    `,
    `<figure class="language-js"><figcaption>{#my-id}</figcaption><pre class="language-js"><code class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

test(
  'code with attr-like brace continuing title value',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js title=title{#continue-title} {.this-is-expected-attr}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "title=title{#continue-title} {.this-is-expected-attr}"
    `,
    `<figure class="language-js"><figcaption>title{#continue-title}</figcaption><pre class="language-js"><code class="language-js this-is-expected-attr"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);

test(
  'code with quoted title containing space and attr-like brace',
  buildProcessorTestingCode(
    stripIndent`
    \`\`\`js title="title {#not-attr}" {#real-attr}
    'Hello code'
    \`\`\`
    `,
    stripIndent`
    root[1]
    └─0 code "'Hello code'"
          lang: "js"
          meta: "title=\\"title {#not-attr}\\" {#real-attr}"
    `,
    `<figure class="language-js"><figcaption>title {#not-attr}</figcaption><pre class="language-js"><code id="real-attr" class="language-js"><span class="token string">'Hello code'</span></code></pre></figure>`,
  ),
);
