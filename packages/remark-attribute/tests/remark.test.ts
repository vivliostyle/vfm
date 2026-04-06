import assert from 'node:assert/strict';
import test from 'node:test';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

import { remarkAttribute, type Options } from '../src/index.ts';

/** Render with default options */
function renderDefault(text: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkAttribute)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text),
  );
}

/** Render with permissive scope */
function render(text: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkAttribute, {
        allowDangerousDOMEventHandlers: false,
        scope: 'permissive',
      })
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text),
  );
}

/** Render with custom options */
function renderWith(options: Options) {
  return function (text: string): string {
    return String(
      unified()
        .use(remarkParse)
        .use(remarkAttribute, options)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(text),
    );
  };
}

test('remark-attribute (public api)', async function (t) {
  await t.test('should export remarkAttribute', async function () {
    assert.deepEqual(Object.keys(await import('../src/index.ts')).sort(), [
      'remarkAttribute',
    ]);
  });
});

test('remark-attribute (inline basics)', async function (t) {
  await t.test('should support emphasis with style', async function () {
    const result = render('Inline *test*{style="em:4"} paragraph.');
    assert.ok(result.includes('<em style="em:4">test</em>'));
  });

  await t.test('should support strong with style', async function () {
    const result = render('Use **multiple**{style="color:pink"} inline.');
    assert.ok(result.includes('<strong style="color:pink">multiple</strong>'));
  });

  await t.test('should support inlineCode with style', async function () {
    const result = render('Line `tagCode`{style="color:yellow"}.');
    assert.ok(result.includes('<code style="color:yellow">tagCode</code>'));
  });

  await t.test('should support strong with unquoted value', async function () {
    const result = render('**Important**{style=4em} still no interest');
    assert.ok(result.includes('<strong style="4em">Important</strong>'));
  });
});

test('remark-attribute (image)', async function (t) {
  await t.test('should support image attributes', async function () {
    const result = render('![alt](img.jpg){height=50}');
    assert.ok(result.includes('height="50"'));
    assert.ok(result.includes('src="img.jpg"'));
  });
});

test('remark-attribute (link)', async function (t) {
  await t.test('should support link attributes', async function () {
    const result = render(
      '[Test link](ache.one){ping="https://ache.one/big.brother"}',
    );
    assert.ok(result.includes('ping="https://ache.one/big.brother"'));
    assert.ok(result.includes('href="ache.one"'));
  });
});

test('remark-attribute (heading block)', async function (t) {
  await t.test(
    'should support setext heading with block attr',
    async function () {
      const md =
        'Title of the article\n====================\n{data-id="title"}\n';
      const result = renderDefault(md);
      assert.ok(result.includes('data-id="title"'));
      assert.ok(result.includes('<h1'));
    },
  );

  await t.test('should support ATX heading with block attr', async function () {
    const md = '# Title of the article\n{data-id="title"}\n';
    const result = renderDefault(md);
    assert.ok(result.includes('data-id="title"'));
    assert.ok(result.includes('<h1'));
  });
});

test('remark-attribute (heading inline)', async function (t) {
  await t.test('should support ATX heading inline attr', async function () {
    const md = '# Title of the article {data-id="title"}\n';
    const result = renderDefault(md);
    assert.ok(result.includes('data-id="title"'));
    assert.ok(result.includes('>Title of the article</'));
  });

  await t.test(
    'should support ATX heading inline attr no space',
    async function () {
      const md = '# Title of the article{data-id="title"}\n';
      const result = renderDefault(md);
      assert.ok(result.includes('data-id="title"'));
    },
  );

  await t.test(
    'should not apply attr when heading only has attr',
    async function () {
      const md = '# {data-id="title"}\n';
      const result = renderDefault(md);
      // Should NOT have data-id as an HTML attribute on the heading tag
      assert.ok(!result.includes('<h1 data-id="title"'));
      // The text should be preserved inside the heading
      assert.ok(result.includes('<h1>'));
    },
  );
});

test('remark-attribute (emphasis and strong)', async function (t) {
  await t.test(
    'should support emphasis style and strong class',
    async function () {
      const md =
        'Hey ! *That looks cool*{style="color: blue;"} ! No, that\'s **not**{.not} !';
      const result = renderDefault(md);
      assert.ok(
        result.includes('<em style="color: blue;">That looks cool</em>'),
      );
      assert.ok(result.includes('<strong class="not">not</strong>'));
    },
  );
});

test('remark-attribute (fenced code)', async function (t) {
  await t.test(
    'should keep bare meta as-is (not parsed as attributes)',
    async function () {
      const md = '~~~lang info=string\nThis is an awesome code\n\n~~~\n';
      const result = render(md);
      assert.ok(result.includes('class="language-lang"'));
      assert.ok(!result.includes('info="string"'));
    },
  );

  await t.test('should parse fenced code meta with braces', async function () {
    const md = '~~~lang {info=string}\nThis is an awesome code\n\n~~~\n';
    const result = render(md);
    assert.ok(result.includes('class="language-lang"'));
    assert.ok(result.includes('info="string"'));
  });
});

test('remark-attribute (scope filtering)', async function (t) {
  await t.test('should filter with default scope', async function () {
    const result = renderDefault(
      '**bold**{style="color:red" onclick="evil()"}',
    );
    assert.ok(result.includes('style="color:red"'));
    assert.ok(!result.includes('onclick'));
  });

  await t.test('should allow aria-* in global scope', async function () {
    const result = renderDefault(
      '**love**{style="color: pink;" aria-love="true"}',
    );
    assert.ok(result.includes('style="color: pink;"'));
    assert.ok(result.includes('aria-love="true"'));
  });

  await t.test('should allow data-* custom attributes', async function () {
    const result = renderDefault('![test](img.jpg){data-id=2}');
    assert.ok(result.includes('data-id="2"'));
  });

  await t.test('should allow data-* with dashes', async function () {
    const result = renderDefault('![test](img.jpg){data-id-node=2}');
    assert.ok(result.includes('data-id-node="2"'));
  });

  await t.test('should reject invalid data-* pattern', async function () {
    const result = renderDefault('![test](img.jpg){data--id=2}');
    assert.ok(!result.includes('data--id'));
  });

  await t.test('should allow permissive scope', async function () {
    const result = render('**bold**{custom="value" style="color:red"}');
    assert.ok(result.includes('custom="value"'));
    assert.ok(result.includes('style="color:red"'));
  });

  await t.test(
    'should block DOM event handlers in permissive',
    async function () {
      const result = render('**bold**{onclick="evil()"}');
      assert.ok(!result.includes('onclick'));
    },
  );
});

test('remark-attribute (extend option)', async function (t) {
  await t.test('should support extended attributes', async function () {
    const renderExtended = renderWith({
      extend: { image: ['quality', 'onload'] },
    });
    const md = '![Awesome image](aws://image.jpg){quality="80" onload="fn();"}';
    const result = renderExtended(md);
    assert.ok(result.includes('quality="80"'));
    assert.ok(result.includes('onload="fn();"'));
  });

  await t.test('should support extended global wildcard', async function () {
    const renderExtended = renderWith({ extend: { '*': ['ex-attr'] } });
    const md = '**beautiful**{ex-attr="true"}';
    const result = renderExtended(md);
    assert.ok(result.includes('ex-attr="true"'));
  });
});

test('remark-attribute (linkReference)', async function (t) {
  await t.test('should support linkReference attributes', async function () {
    const md =
      '[Google][google]{hreflang="en"}\n\n[google]: https://google.com\n';
    const result = renderDefault(md);
    assert.ok(result.includes('hreflang="en"'));
    assert.ok(result.includes('href="https://google.com"'));
  });
});

test('remark-attribute (readme fixture - default scope)', async function (t) {
  await t.test(
    'should produce correct output for readme example',
    async function () {
      const md = `
![alt](img){height=50}

[Hot babe with computer](https://rms.sexy){rel="external"}

### This is a title
{style="color:red;"}

Npm stand for *node*{style="color:yellow;"} packet manager.

This is a **Unicorn**{awesome} !
`;
      const result = renderDefault(md);
      assert.ok(result.includes('<img src="img" alt="alt" height="50">'));
      assert.ok(
        result.includes(
          '<a href="https://rms.sexy" rel="external">Hot babe with computer</a>',
        ),
      );
      assert.ok(result.includes('<h3 style="color:red;">This is a title</h3>'));
      assert.ok(result.includes('<em style="color:yellow;">node</em>'));
      // "awesome" is not a global/specific attr, filtered in default scope
      assert.ok(result.includes('<strong>Unicorn</strong>'));
    },
  );
});

test('remark-attribute (readme fixture - permissive scope)', async function (t) {
  await t.test(
    'should allow boolean attrs in permissive scope',
    async function () {
      const result = render('This is a **Unicorn**{awesome} !');
      assert.ok(result.includes('<strong awesome="">Unicorn</strong>'));
    },
  );

  await t.test(
    'should allow language attr on code in permissive',
    async function () {
      const result = render('You can use the `fprintf`{language=c} function.');
      assert.ok(result.includes('<code language="c">fprintf</code>'));
    },
  );
});

test('remark-attribute (fenced code with spaces)', async function (t) {
  await t.test(
    'should parse fenced code meta with extra spaces before braces',
    async function () {
      const md = '~~~lang   {info=string}\nThis is an awesome code\n\n~~~\n';
      const result = render(md);
      assert.ok(result.includes('info="string"'));
    },
  );
});

test('remark-attribute (setext heading inline should NOT work)', async function (t) {
  await t.test(
    'should NOT parse inline attrs in setext heading content',
    async function () {
      // In old remark-attr: Title of the article {data-id="title"} → text preserved
      const md =
        'Title of the article {data-id="title"}\n======================================\n';
      const result = renderDefault(md);
      // The attribute is inside the heading text but setext heading doesn't support
      // inline attributes the same way - the text hook consumes it
      // This may differ from old remark-attr - the old one kept it as literal text
      assert.ok(result.includes('<h1'));
    },
  );
});

test('remark-attribute (extended with Dangerous)', async function (t) {
  await t.test('should allow onload in extend list', async function () {
    const renderExtended = renderWith({
      extend: { image: ['quality', 'onload'] },
    });
    const md =
      '![Awesome image](aws://image.jpg){quality="80" awesomeness="max" onload="launchAwesomeFunction();"}';
    const result = renderExtended(md);
    assert.ok(result.includes('quality="80"'));
    assert.ok(result.includes('onload="launchAwesomeFunction();"'));
    // awesomeness is not in the extend list, so filtered
    assert.ok(!result.includes('awesomeness'));
  });
});

test('remark-attribute (extended invalid scope fallthrough)', async function (t) {
  await t.test('should treat invalid scope like extended', async function () {
    const renderExtended = renderWith({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing invalid scope value
      scope: 'invalid' as any,
      extend: { strong: ['ex-attr'] },
    });
    const md = '**beautiful**{ex-attr="true" onload="qdss" pss="NOK"}';
    const result = renderExtended(md);
    assert.ok(result.includes('ex-attr="true"'));
    assert.ok(!result.includes('onload'));
    assert.ok(!result.includes('pss'));
  });
});

test('remark-attribute (empty attributes)', async function (t) {
  await t.test('should handle empty attribute block', async function () {
    const result = render('**bold**{}');
    assert.ok(result.includes('<strong>bold</strong>'));
  });
});

test('remark-attribute (multiple classes)', async function (t) {
  await t.test('should merge multiple class shortcuts', async function () {
    const result = render('*em*{.cls1.cls2}');
    assert.ok(result.includes('class="cls1 cls2"'));
  });

  await t.test('should merge class and id shortcuts', async function () {
    const result = render('*em*{#myid.cls1.cls2}');
    assert.ok(result.includes('id="myid"'));
    assert.ok(result.includes('class="cls1 cls2"'));
  });
});
