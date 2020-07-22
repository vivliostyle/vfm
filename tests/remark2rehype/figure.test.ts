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
    `<p><figure><img src="./img.png" alt="caption"><figcaption>caption</figcaption></figure></p>`,
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
