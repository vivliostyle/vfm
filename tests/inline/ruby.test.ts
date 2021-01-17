import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from '../utils';

it(
  'simple ruby',
  buildProcessorTestingCode(
    `{a|b}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 ruby[1]
            │ data: {"hName":"ruby","rubyText":"b"}
            └─0 text "a"
    `,
    `<p><ruby>a<rt>b</rt></ruby></p>`,
  ),
);

it(
  'enables escape in ruby body',
  buildProcessorTestingCode(
    `{a\\|b|c}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 ruby[1]
            │ data: {"hName":"ruby","rubyText":"b|c"}
            └─0 text "a\\\\"
    `,
    `<p><ruby>a\\<rt>b|c</rt></ruby></p>`,
  ),
);

it(
  'disables any inline rule in <rt>',
  buildProcessorTestingCode(
    `{a|*b*}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 ruby[1]
            │ data: {"hName":"ruby","rubyText":"*b*"}
            └─0 text "a"
    `,
    `<p><ruby>a<rt>*b*</rt></ruby></p>`,
  ),
);

it(
  'nested ruby',
  buildProcessorTestingCode(
    `{{a|b}|c}`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 ruby[1]
        │   │ data: {"hName":"ruby","rubyText":"b"}
        │   └─0 text "{a"
        └─1 text "|c}"
    `,
    `<p><ruby>{a<rt>b</rt></ruby>|c}</p>`,
  ),
);

it(
  'ruby with newline',
  buildProcessorTestingCode(
    `{a\nb|c}`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "{a"
        ├─1 break
        └─2 text "b|c}"
    `,
    `<p>{a<br>\nb|c}</p>`,
    { autoLineBreaks: true, partial: true },
  ),
);
