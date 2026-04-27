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
