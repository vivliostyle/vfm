import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from '../utils';

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
    `<div class="math math-display"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.8641079999999999em;vertical-align:0em;"></span><span class="mord"><span class="mord mathdefault" style="margin-right:0.03588em;">v</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8641079999999999em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span></div>`,
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
    `<div class="math math-display"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.5782em;vertical-align:-0.0391em;"></span><span class="mrel">&#x3C;</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span></span><span class="base"><span class="strut" style="height:0.73354em;vertical-align:-0.0391em;"></span><span class="mord mathdefault">d</span><span class="mord mathdefault">i</span><span class="mord mathdefault" style="margin-right:0.03588em;">v</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span><span class="mrel">></span></span><span class="base"><span class="strut" style="height:0.5782em;vertical-align:-0.0391em;"></span><span class="mrel">&#x3C;</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span></span><span class="base"><span class="strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">/</span><span class="mord mathdefault">d</span><span class="mord mathdefault">i</span><span class="mord mathdefault" style="margin-right:0.03588em;">v</span><span class="mspace" style="margin-right:0.2777777777777778em;"></span><span class="mrel">></span></span></span></span></span></div>`,
  ),
);
