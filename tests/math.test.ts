import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils';

it(
  'simple math block',
  buildProcessorTestingCode(
    stripIndent`
    $$
    v^2
    $$
    `,
    stripIndent`
    root[1]
    └─0 math "v^2"
          data: {"hName":"div","hProperties":{"className":["math","math-display"]},"hChildren":[{"type":"text","value":"v^2"}]}
    `,
    `<div class="math math-display"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.8641079999999999em;vertical-align:0em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.03588em;">v</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8641079999999999em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span></div>`,
  ),
);

it(
  'paired dollar',
  buildProcessorTestingCode(
    stripIndent`
    $$$
    $
    $$
    $$$
    `,
    stripIndent`
    root[1]
    └─0 math "$\\n$$"
          data: {"hName":"div","hProperties":{"className":["math","math-display"]},"hChildren":[{"type":"text","value":"$\\n$$"}]}
    `,
    `<div class="math math-display"><span class="katex-error" title="ParseError: KaTeX parse error: Can&#x27;t use function &#x27;$&#x27; in math mode at position 1: $̲ $$" style="color:#cc0000">$ $$</span></div>`,
  ),
);

it(
  'skip any block rules inside math',
  buildProcessorTestingCode(
    stripIndent`
    $$

    <div></div>
    $$
    `,
    stripIndent`
    root[1]
    └─0 math "\\n<div></div>"
          data: {"hName":"div","hProperties":{"className":["math","math-display"]},"hChildren":[{"type":"text","value":"\\n<div></div>"}]}
    `,
    `<div class="math math-display"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.5782em;vertical-align:-0.0391em;"></span><span class="mrel">&#x3C;</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span></span><span class="base"><span class="strut" style="height:0.73354em;vertical-align:-0.0391em;"></span><span class="mord mathnormal">d</span><span class="mord mathnormal">i</span><span class="mord mathnormal" style="margin-right:0.03588em;">v</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span><span class="mrel">></span></span><span class="base"><span class="strut" style="height:0.5782em;vertical-align:-0.0391em;"></span><span class="mrel">&#x3C;</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span></span><span class="base"><span class="strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">/</span><span class="mord mathnormal">d</span><span class="mord mathnormal">i</span><span class="mord mathnormal" style="margin-right:0.03588em;">v</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span><span class="mrel">></span></span></span></span></span></div>`,
  ),
);

describe('inline', () => {
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
});
