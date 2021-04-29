import { stringify } from '../src/index';

// This test always fails, `remark-attr` does not handle empty headings.
/*
it('plain section', () => {
  const md = '# {.ok}';
  const received = stringify(md, { partial: true, disableFormatHtml: true });
  const expected = '<section class="level1 ok"></section>';
  expect(received).toBe(expected);
});
*/

it('Leveling and copy attributes, however the `id` will be moved', () => {
  const md = '# こんにちは {#id1 .class1 key1=value1}';
  const received = stringify(md, { partial: true });
  const expected = `
<section id="id1" class="level1 class1" key1="value1">
  <h1 class="class1" key1="value1">こんにちは</h1>
</section>
`;
  expect(received).toBe(expected);
});

it('Heading with hidden attribute', () => {
  const md = '# Heading {hidden}';
  const received = stringify(md, { partial: true, disableFormatHtml: true });
  const expected =
    '<section id="heading" class="level1"><h1 hidden>Heading</h1></section>';
  expect(received).toBe(expected);
});

it('<h7> is not heading', () => {
  const md = '####### こんにちは {.test}';
  const received = stringify(md, { partial: true, disableFormatHtml: true });
  const expected = '<p>####### こんにちは {.test}</p>';
  expect(received).toBe(expected);
});

it('<h1>, ... <h6>', () => {
  const md = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`;
  const received = stringify(md, { partial: true });
  const expected = `
<section id="heading-1" class="level1">
  <h1>Heading 1</h1>
  <section id="heading-2" class="level2">
    <h2>Heading 2</h2>
    <section id="heading-3" class="level3">
      <h3>Heading 3</h3>
      <section id="heading-4" class="level4">
        <h4>Heading 4</h4>
        <section id="heading-5" class="level5">
          <h5>Heading 5</h5>
          <section id="heading-6" class="level6">
            <h6>Heading 6</h6>
          </section>
        </section>
      </section>
    </section>
  </section>
</section>
`;
  expect(received).toBe(expected);
});

// It seems that when the class is processed by `remark-attr`, it is output before id.
it('<h1>, ... <h6> with attribute', () => {
  const md = `# Heading 1 {.depth1}
## Heading 2 {.depth2}
### Heading 3 {.depth3}
#### Heading 4 {.depth4}
##### Heading 5 {.depth5}
###### Heading 6 {.depth6}`;
  const received = stringify(md, { partial: true });
  const expected = `
<section class="level1 depth1" id="heading-1">
  <h1 class="depth1">Heading 1</h1>
  <section class="level2 depth2" id="heading-2">
    <h2 class="depth2">Heading 2</h2>
    <section class="level3 depth3" id="heading-3">
      <h3 class="depth3">Heading 3</h3>
      <section class="level4 depth4" id="heading-4">
        <h4 class="depth4">Heading 4</h4>
        <section class="level5 depth5" id="heading-5">
          <h5 class="depth5">Heading 5</h5>
          <section class="level6 depth6" id="heading-6">
            <h6 class="depth6">Heading 6</h6>
          </section>
        </section>
      </section>
    </section>
  </section>
</section>
`;
  expect(received).toBe(expected);
});

it('Complex structure', () => {
  const md = `# Heading 1
## Heading 2 {.foo}
# Heading 1`;
  const received = stringify(md, { partial: true });
  const expected = `
<section id="heading-1" class="level1">
  <h1>Heading 1</h1>
  <section class="level2 foo" id="heading-2">
    <h2 class="foo">Heading 2</h2>
  </section>
</section>
<section id="heading-1-1" class="level1">
  <h1>Heading 1</h1>
</section>
`;
  expect(received).toBe(expected);
});
