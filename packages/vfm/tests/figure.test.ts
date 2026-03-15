import { test } from 'vitest';
import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils';

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
