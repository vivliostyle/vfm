import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from '../utils';

it(
  'simple inlineMath',
  buildProcessorTestingCode(
    `$x$`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 inlineMath "x"
              data: {"hName":"span","hProperties":{"className":["math","math-inline"]},"hChildren":[{"type":"text","value":"x"}]}
    `,
    `<p><span class="math math-inline"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.43056em;vertical-align:0em;"></span><span class="mord mathnormal">x</span></span></span></span></span></p>`,
  ),
);

it(
  "isn't greedy",
  buildProcessorTestingCode(
    `$x$y$`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 inlineMath "x"
        │     data: {"hName":"span","hProperties":{"className":["math","math-inline"]},"hChildren":[{"type":"text","value":"x"}]}
        └─1 text "y$"
    `,
    `<p><span class="math math-inline"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.43056em;vertical-align:0em;"></span><span class="mord mathnormal">x</span></span></span></span></span>y$</p>`,
  ),
);

it(
  'double dollar',
  buildProcessorTestingCode(
    `$$x$$`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 inlineMath "x"
              data: {"hName":"span","hProperties":{"className":["math","math-inline"]},"hChildren":[{"type":"text","value":"x"}]}
    `,
    `<p><span class="math math-inline"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.43056em;vertical-align:0em;"></span><span class="mord mathnormal">x</span></span></span></span></span></p>`,
  ),
);

it(
  'empty math',
  buildProcessorTestingCode(
    `$$`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 text "$$"
    `,
    `<p>$$</p>`,
  ),
);

it(
  'nested math',
  buildProcessorTestingCode(
    `$$a$b$$c$`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 inlineMath "a$b"
        │     data: {"hName":"span","hProperties":{"className":["math","math-inline"]},"hChildren":[{"type":"text","value":"a$b"}]}
        └─1 text "c$"
    `,
    `<p><span class="math math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Can&#x27;t use function &#x27;$&#x27; in math mode at position 2: a$̲b" style="color:#cc0000">a$b</span></span>c$</p>`,
  ),
);

it(
  'math with newline',
  buildProcessorTestingCode(
    `$x\ny$`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 inlineMath "x\\ny"
              data: {"hName":"span","hProperties":{"className":["math","math-inline"]},"hChildren":[{"type":"text","value":"x\\ny"}]}
    `,
    `<p><span class="math math-inline"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.625em;vertical-align:-0.19444em;"></span><span class="mord mathnormal">x</span><span class="mord mathnormal" style="margin-right:0.03588em;">y</span></span></span></span></span></p>`,
  ),
);
