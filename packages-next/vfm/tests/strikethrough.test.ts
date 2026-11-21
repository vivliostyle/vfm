import { test } from 'vitest';
import { buildHtmlTestingCode, buildProcessorTestingCode } from './utils.js';

// GFM strikethrough. remark-gfm 4 keeps its default `singleTilde: true`, so
// one tilde works like two, as in the GFM specification ("one or two tildes")
// and on GitHub. remark-parse 8 recognized `~~` only. Decided in #324.

test(
  'two tildes',
  buildProcessorTestingCode(
    `これは~~削除~~です`,
    `
root[1]
└─0 paragraph[3]
    ├─0 text "これは"
    ├─1 delete[1]
    │   └─0 text "削除"
    └─2 text "です"
`,
    `<p>これは<del>削除</del>です</p>`,
  ),
);

test(
  'one tilde',
  buildProcessorTestingCode(
    `a ~b~ c`,
    `
root[1]
└─0 paragraph[3]
    ├─0 text "a "
    ├─1 delete[1]
    │   └─0 text "b"
    └─2 text " c"
`,
    `<p>a <del>b</del> c</p>`,
  ),
);

test(
  'one tilde between letters and next to CJK punctuation',
  buildHtmlTestingCode(
    `H~2~O、これは~削除~です、これは~（削除）~です`,
    `<p>H<del>2</del>O、これは<del>削除</del>です、これは<del>（削除）</del>です</p>`,
  ),
);

test(
  'the opening and closing runs must have the same length',
  buildHtmlTestingCode(
    `a ~b~~ c\n\nd ~~e~ f`,
    `<p>a ~b~~ c</p>\n<p>d ~~e~ f</p>`,
  ),
);

test(
  'three or more tildes are not a strikethrough',
  buildHtmlTestingCode(`a ~~~b~~~ c`, `<p>a ~~~b~~~ c</p>`),
);

test(
  'a tilde with a space on its inner side does not open or close',
  buildHtmlTestingCode(`10 ~ 20 と 30 ~ 40`, `<p>10 ~ 20 と 30 ~ 40</p>`),
);

test(
  'a lone tilde stays as written',
  buildHtmlTestingCode(`10~20`, `<p>10~20</p>`),
);

test(
  'two range tildes in one paragraph pair up',
  buildHtmlTestingCode(
    `3~5 個、または 7~9 個`,
    `<p>3<del>5 個、または 7</del>9 個</p>`,
  ),
);

test(
  'escaped tildes and tildes in code stay as written',
  buildHtmlTestingCode(
    '3\\~5 個、または 7\\~9 個 `~a~`',
    `<p>3~5 個、または 7~9 個 <code>~a~</code></p>`,
  ),
);
