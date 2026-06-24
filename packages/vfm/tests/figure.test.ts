import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils.js';

test(
  'simple figure output',
  buildProcessorTestingCode(
    `![caption](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><img src="./img.png" alt="caption"><figcaption aria-hidden="true">caption</figcaption></figure>`,
  ),
);

test(
  'adjacent HTML comment does not suppress figure and is kept right after the img',
  buildProcessorTestingCode(
    `![caption](./img.png)<!-- comment -->`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        └─1 html "<!-- comment -->"
    `,
    `<figure><img src="./img.png" alt="caption"><!-- comment --><figcaption aria-hidden="true">caption</figcaption></figure>`,
  ),
);

test(
  'multiple comments stay right after the img in order',
  buildProcessorTestingCode(
    `![caption](./img.png)<!-- a --><!-- b -->`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        ├─1 html "<!-- a -->"
        └─2 html "<!-- b -->"
    `,
    `<figure><img src="./img.png" alt="caption"><!-- a --><!-- b --><figcaption aria-hidden="true">caption</figcaption></figure>`,
  ),
);

test(
  'comment stays right after the img with imgFigcaptionOrder: figcaption-img',
  buildProcessorTestingCode(
    `![caption](./img.png)<!-- c -->`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        └─1 html "<!-- c -->"
    `,
    `<figure><figcaption aria-hidden="true">caption</figcaption><img src="./img.png" alt="caption"><!-- c --></figure>`,
    { imgFigcaptionOrder: 'figcaption-img' },
  ),
);

test(
  'two images separated by a comment stay a paragraph',
  buildProcessorTestingCode(
    `![a](./a.png)<!-- c -->![b](./b.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 image
        │     title: null
        │     url: "./a.png"
        │     alt: "a"
        ├─1 html "<!-- c -->"
        └─2 image
              title: null
              url: "./b.png"
              alt: "b"
    `,
    `<p><img src="./a.png" alt="a"><!-- c --><img src="./b.png" alt="b"></p>`,
  ),
);

test(
  'an adjacent inline HTML element keeps it a paragraph',
  buildProcessorTestingCode(
    `![caption](./img.png)<span>x</span>`,
    stripIndent`
    root[1]
    └─0 paragraph[4]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        ├─1 html "<span>"
        ├─2 text "x"
        └─3 html "</span>"
    `,
    `<p><img src="./img.png" alt="caption"><span>x</span></p>`,
  ),
);

test(
  'garbage in, garbage out: an orphan close tag is content, not a comment, so the image stays a paragraph',
  buildProcessorTestingCode(
    `![caption](./img.png)</figure>`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        └─1 html "</figure>"
    `,
    `<p><img src="./img.png" alt="caption"></p>`,
  ),
);

test(
  'garbage in, garbage out: a close tag wrapping the image keeps it a paragraph the div closes around',
  buildProcessorTestingCode(
    stripIndent`
    <div>

    ![caption](./img.png)</div>
    `,
    stripIndent`
    root[2]
    ├─0 html "<div>"
    └─1 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        └─1 html "</div>"
    `,
    stripIndent`
    <div>
    <p><img src="./img.png" alt="caption"></p></div><p></p>
    `,
  ),
);

test(
  'whitespace between image and comment is content, so it stays a paragraph',
  buildProcessorTestingCode(
    `![caption](./img.png) <!-- c -->`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        ├─1 text " "
        └─2 html "<!-- c -->"
    `,
    `<p><img src="./img.png" alt="caption"> <!-- c --></p>`,
  ),
);

test(
  'bare trailing whitespace (no comment) is content, so it stays a paragraph',
  buildProcessorTestingCode(
    `![caption](./img.png) `,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        └─1 text " "
    `,
    `<p><img src="./img.png" alt="caption"> </p>`,
  ),
);

// A line beginning with `<!--` opens a CommonMark raw HTML block (block type
// 2): the whole line, `![](...)` and all, is taken as raw text and never
// parsed, so no figure forms and the line is passed through verbatim. Confirmed
// in the commonmark.js reference implementation and markdown-it.
test(
  'a leading comment makes the whole line a raw HTML block, not a figure',
  buildProcessorTestingCode(
    `<!-- c -->![](./img.png)`,
    `root[1]
└─0 html "<!-- c -->![](./img.png)"`,
    `<!-- c -->![](./img.png)`,
  ),
);

test(
  'captionless image with comment keeps default paragraph policy (comment preserved)',
  buildProcessorTestingCode(
    `![](./img.png)<!-- c -->`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: null
        └─1 html "<!-- c -->"
    `,
    `<p><img src="./img.png"><!-- c --></p>`,
  ),
);

test(
  "captionlessImagePolicy: 'figure' promotes an image trailed by a comment",
  buildProcessorTestingCode(
    `![](./img.png)<!-- c -->`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: null
        └─1 html "<!-- c -->"
    `,
    `<figure><img src="./img.png"><!-- c --></figure>`,
    { captionlessImagePolicy: 'figure' },
  ),
);

test(
  'image without caption',
  buildProcessorTestingCode(
    `![](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: null
    `,
    `<p><img src="./img.png"></p>`,
  ),
);

test(
  "captionlessImagePolicy: 'figure' wraps image without figcaption",
  buildProcessorTestingCode(
    `![](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: null
    `,
    `<figure><img src="./img.png"></figure>`,
    { captionlessImagePolicy: 'figure' },
  ),
);

test(
  "captionlessImagePolicy: 'figure-with-figcaption' emits empty figcaption",
  buildProcessorTestingCode(
    `![](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: null
    `,
    `<figure><img src="./img.png"><figcaption aria-hidden="true"></figcaption></figure>`,
    { captionlessImagePolicy: 'figure-with-figcaption' },
  ),
);

test(
  "captionlessImagePolicy: 'figure-with-figcaption' keeps a comment after the img",
  buildProcessorTestingCode(
    `![](./img.png)<!-- c -->`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: null
        └─1 html "<!-- c -->"
    `,
    `<figure><img src="./img.png"><!-- c --><figcaption aria-hidden="true"></figcaption></figure>`,
    { captionlessImagePolicy: 'figure-with-figcaption' },
  ),
);

test(
  "captionlessImagePolicy: 'figure' does not promote inline image",
  buildProcessorTestingCode(
    `text ![](./img.png) text`,
    stripIndent`
    root[1]
    └─0 paragraph[3]
        ├─0 text "text "
        ├─1 image
        │     title: null
        │     url: "./img.png"
        │     alt: null
        └─2 text " text"
    `,
    `<p>text <img src="./img.png"> text</p>`,
    { captionlessImagePolicy: 'figure' },
  ),
);

test(
  "captionlessImagePolicy: 'figure' does not affect captioned image",
  buildProcessorTestingCode(
    `![caption](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><img src="./img.png" alt="caption"><figcaption aria-hidden="true">caption</figcaption></figure>`,
    { captionlessImagePolicy: 'figure' },
  ),
);

test(
  "captionlessImagePolicy: 'figure' with assignIdToFigcaption keeps ID on img",
  buildProcessorTestingCode(
    `![](./img.png){#fig1}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: null
    `,
    `<figure><img src="./img.png" id="fig1"></figure>`,
    {
      captionlessImagePolicy: 'figure',
      assignIdToFigcaption: true,
    },
  ),
);

test(
  "captionlessImagePolicy: 'figure-with-figcaption' with imgFigcaptionOrder: figcaption-img",
  buildProcessorTestingCode(
    `![](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: null
    `,
    `<figure><figcaption aria-hidden="true"></figcaption><img src="./img.png"></figure>`,
    {
      captionlessImagePolicy: 'figure-with-figcaption',
      imgFigcaptionOrder: 'figcaption-img',
    },
  ),
);

test(
  "captionlessImagePolicy: 'figure-with-figcaption' with assignIdToFigcaption moves ID to empty figcaption",
  buildProcessorTestingCode(
    `![](./img.png){#fig1}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: null
    `,
    `<figure><img src="./img.png"><figcaption aria-hidden="true" id="fig1"></figcaption></figure>`,
    {
      captionlessImagePolicy: 'figure-with-figcaption',
      assignIdToFigcaption: true,
    },
  ),
);

test(
  "captionlessImagePolicy: 'figure-with-figcaption' does not affect captioned image",
  buildProcessorTestingCode(
    `![caption](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><img src="./img.png" alt="caption"><figcaption aria-hidden="true">caption</figcaption></figure>`,
    { captionlessImagePolicy: 'figure-with-figcaption' },
  ),
);

test(
  'Only single line',
  buildProcessorTestingCode(
    stripIndent`
    ![caption](./img.png)
    
    text ![caption](./img.png)
    `,
    stripIndent`
    root[2]
    ├─0 paragraph[1]
    │   └─0 image
    │         title: null
    │         url: "./img.png"
    │         alt: "caption"
    └─1 paragraph[2]
        ├─0 text "text "
        └─1 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    stripIndent`
    <figure><img src="./img.png" alt="caption"><figcaption aria-hidden="true">caption</figcaption></figure>
    <p>text <img src="./img.png" alt="caption"></p>
    `,
  ),
);

test(
  'Attributes',
  buildProcessorTestingCode(
    `![caption](./img.png "title"){id="image" data-sample="sample"}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: "title"
              url: "./img.png"
              alt: "caption"
              data: {"hProperties":{"id":"image","data-sample":"sample"}}
    `,
    `<figure><img src="./img.png" alt="caption" title="title" id="image" data-sample="sample"><figcaption aria-hidden="true">caption</figcaption></figure>`,
  ),
);

test(
  'imgFigcaptionOrder: figcaption-img',
  buildProcessorTestingCode(
    `![caption](./img.png)`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><figcaption aria-hidden="true">caption</figcaption><img src="./img.png" alt="caption"></figure>`,
    { imgFigcaptionOrder: 'figcaption-img' },
  ),
);

test(
  'imgFigcaptionOrder should not affect raw HTML figure',
  buildProcessorTestingCode(
    `<figure><img src="./img.png" alt="caption"><figcaption>caption</figcaption></figure>`,
    `root[1]
└─0 html "<figure><img src=\\"./img.png\\" alt=\\"caption\\"><figcaption>caption</figcaption></figure>"`,
    `<figure><img src="./img.png" alt="caption"><figcaption>caption</figcaption></figure>`,
    { imgFigcaptionOrder: 'figcaption-img' },
  ),
);

test(
  'assignIdToFigcaption moves ID from img to figcaption',
  buildProcessorTestingCode(
    `![caption](./img.png){#id}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><img src="./img.png" alt="caption"><figcaption aria-hidden="true" id="id">caption</figcaption></figure>`,
    { assignIdToFigcaption: true },
  ),
);

test(
  'assignIdToFigcaption moves ID to figcaption with a comment after the img',
  buildProcessorTestingCode(
    `![caption](./img.png){#id}<!-- c -->`,
    stripIndent`
    root[1]
    └─0 paragraph[2]
        ├─0 image
        │     title: null
        │     url: "./img.png"
        │     alt: "caption"
        │     data: {"hProperties":{"id":"id"}}
        └─1 html "<!-- c -->"
    `,
    `<figure><img src="./img.png" alt="caption"><!-- c --><figcaption aria-hidden="true" id="id">caption</figcaption></figure>`,
    { assignIdToFigcaption: true },
  ),
);

test(
  'assignIdToFigcaption with imgFigcaptionOrder: figcaption-img',
  buildProcessorTestingCode(
    `![caption](./img.png){#id}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><figcaption aria-hidden="true" id="id">caption</figcaption><img src="./img.png" alt="caption"></figure>`,
    { assignIdToFigcaption: true, imgFigcaptionOrder: 'figcaption-img' },
  ),
);

test(
  'assignIdToFigcaption: false keeps ID on img (default behavior)',
  buildProcessorTestingCode(
    `![caption](./img.png){#id}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
    `,
    `<figure><img src="./img.png" alt="caption" id="id"><figcaption aria-hidden="true">caption</figcaption></figure>`,
    { assignIdToFigcaption: false },
  ),
);

test(
  'distinct explicit alt drops figcaption aria-hidden',
  buildProcessorTestingCode(
    `![caption](./img.png){alt="alt text"}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
              data: {"hProperties":{"alt":"alt text"}}
    `,
    `<figure><img src="./img.png" alt="alt text"><figcaption>caption</figcaption></figure>`,
  ),
);

test(
  'explicit alt equal to the caption keeps aria-hidden (no double read)',
  buildProcessorTestingCode(
    `![caption](./img.png){alt="caption"}`,
    stripIndent`
    root[1]
    └─0 paragraph[1]
        └─0 image
              title: null
              url: "./img.png"
              alt: "caption"
              data: {"hProperties":{"alt":"caption"}}
    `,
    `<figure><img src="./img.png" alt="caption"><figcaption aria-hidden="true">caption</figcaption></figure>`,
  ),
);
