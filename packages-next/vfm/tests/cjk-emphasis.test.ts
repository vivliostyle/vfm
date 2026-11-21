import { expect, test } from 'vitest';
import { VFM, type RemarkCjkFriendlyPlugin } from '../src/index.js';
import { buildHtmlTestingCode, buildProcessorTestingCode } from './utils.js';

// CJK friendly emphasis (#318, #193). CommonMark's flanking rules refuse a
// delimiter run with punctuation inside and a letter outside. remark-parse 8
// was lenient there; remark-cjk-friendly restores that for CJK text.

test(
  'strong: punctuation inside, CJK outside',
  buildProcessorTestingCode(
    `を **構文木（AST）**に変換`,
    `
root[1]
└─0 paragraph[3]
    ├─0 text "を "
    ├─1 strong[1]
    │   └─0 text "構文木（AST）"
    └─2 text "に変換"
`,
    `<p>を <strong>構文木（AST）</strong>に変換</p>`,
  ),
);

test(
  'strong: ASCII punctuation inside, CJK outside',
  buildHtmlTestingCode(
    `内に**@rule**を書き`,
    `<p>内に<strong>@rule</strong>を書き</p>`,
  ),
);

test(
  'strong: sentence ending with a full stop inside',
  buildHtmlTestingCode(
    `**強調されます。**この文のせいで。`,
    `<p><strong>強調されます。</strong>この文のせいで。</p>`,
  ),
);

test(
  'strong: without punctuation (unchanged)',
  buildHtmlTestingCode(
    `これは**強調**です`,
    `<p>これは<strong>強調</strong>です</p>`,
  ),
);

test(
  'emphasis: brackets inside, CJK outside',
  buildHtmlTestingCode(
    `これは*「斜体」*です`,
    `<p>これは<em>「斜体」</em>です</p>`,
  ),
);

test(
  'strong: Hangul outside',
  buildHtmlTestingCode(
    `한국어**(강조)**입니다`,
    `<p>한국어<strong>(강조)</strong>입니다</p>`,
  ),
);

test(
  'strikethrough: punctuation inside, CJK outside',
  buildProcessorTestingCode(
    `これは~~（削除）~~です`,
    `
root[1]
└─0 paragraph[3]
    ├─0 text "これは"
    ├─1 delete[1]
    │   └─0 text "（削除）"
    └─2 text "です"
`,
    `<p>これは<del>（削除）</del>です</p>`,
  ),
);

test(
  'next to VFM syntaxes: ruby, attributes and math',
  buildHtmlTestingCode(
    `{漢字|かんじ}**「強調」**{.x}と$x$**（式）**です`,
    `<p><ruby>漢字<rt>かんじ</rt></ruby><strong class="x">「強調」</strong>と<span class="math inline" data-math-typeset="true">\\(x\\)</span><strong>（式）</strong>です</p>`,
    { math: true },
  ),
);

test(
  'non-CJK text keeps the CommonMark rule',
  buildHtmlTestingCode(
    `English **(note)**text`,
    `<p>English **(note)**text</p>`,
  ),
);

// The CJK friendly specification leaves the `_` rules alone: an underscore
// run between letters is never a delimiter (`snake_case`), CJK or not.
test(
  'underscore: intraword runs stay literal',
  buildHtmlTestingCode(
    `それは、__「強調」__である。日本語_斜体_日本語`,
    `<p>それは、__「強調」__である。日本語_斜体_日本語</p>`,
  ),
);

test(
  'underscore: works when separated by spaces',
  buildHtmlTestingCode(
    `それは、 __「強調」__ である。`,
    `<p>それは、 <strong>「強調」</strong> である。</p>`,
  ),
);

test('editPlugins can drop the CJK friendly slots to get plain CommonMark', () => {
  let slot: RemarkCjkFriendlyPlugin | undefined;
  const html = String(
    VFM({
      partial: true,
      disableFormatHtml: true,
      editPlugins: (plugins) => {
        // remark-gfm, remark-cjk-friendly, remark-cjk-friendly-gfm-strikethrough
        const [gfm, cjkFriendly, , ...rest] = plugins.mdastPlugins;
        slot = cjkFriendly;
        return { ...plugins, mdastPlugins: [gfm, ...rest] };
      },
    }).processSync(`を **構文木（AST）**に変換、~~（削除）~~です`),
  );

  expect(slot).toBeDefined();
  expect(html).toBe(`<p>を **構文木（AST）**に変換、~~（削除）~~です</p>`);
});
