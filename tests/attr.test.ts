import { stripIndent } from 'common-tags';
import { buildProcessorTestingCode } from './utils';

it(
  'Header with attributes',
  buildProcessorTestingCode(
    `# Heading {#foo}`,
    stripIndent`
    root[1]
    └─0 heading[1]
        │ depth: 1
        │ data: {"hProperties":{"id":"foo"}}
        └─0 text "Heading"
    `,
    `<section id="foo"><h1>Heading</h1></section>`,
  ),
);

it(
  'Header with attributes, specification by line break',
  buildProcessorTestingCode(
    `# Heading\n{#foo}`,
    stripIndent`
    root[1]
    └─0 heading[1]
        │ depth: 1
        │ data: {"hProperties":{"id":"foo"}}
        └─0 text "Heading"
    `,
    `<section id="foo"><h1>Heading</h1></section>`,
  ),
);

it(
  'Header with attributes and inline elements, specification by line break',
  buildProcessorTestingCode(
    `# Heading *test*\n{#foo}`,
    stripIndent`
    root[1]
    └─0 heading[2]
        │ depth: 1
        │ data: {"hProperties":{"id":"foo"}}
        ├─0 text "Heading "
        └─1 emphasis[1]
            └─0 text "test"
    `,
    `<section id="foo"><h1>Heading <em>test</em></h1></section>`,
  ),
);

// `remark-attr` needs to be fixed
// https://github.com/arobase-che/remark-attr/issues/24
/*
it(
  'Header with attributes and inline elements',
  buildProcessorTestingCode(
    `# Heading *test* {#foo}`,
    stripIndent`
    root[1]
    └─0 heading[2]
        │ depth: 1
        │ data: {"hProperties":{"id":"foo"}}
        ├─0 text "Heading "
        └─1 emphasis[1]
            └─0 text "test"
    `,
    `<section id="foo"><h1>Heading <em>test</em></h1></section>`,
  ),
);
*/
