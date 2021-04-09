import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from '../utils';

it(
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

it(
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

it(
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

it(
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
    `<figure id="image" title="title" data-sample="sample"><img src="./img.png" alt="caption" title="title" data-sample="sample"><figcaption aria-hidden="true">caption</figcaption></figure>`,
  ),
);
