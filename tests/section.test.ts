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

it('<h1>', () => {
  const md = '# こんにちは {.test}';
  const received = stringify(md, { partial: true, disableFormatHtml: true });
  const expected =
    '<section class="level1 test" id="こんにちは"><h1>こんにちは</h1></section>';
  expect(received).toBe(expected);
});

it('<h7> is not heading', () => {
  const md = '####### こんにちは {.test}';
  const received = stringify(md, { partial: true, disableFormatHtml: true });
  const expected = '<p>####### こんにちは {.test}</p>';
  expect(received).toBe(expected);
});

it('<h1>, ... <h6>', () => {
  const md = `# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6`;
  const received = stringify(md, { partial: true });
  const expected = `
<section id="header-1" class="level1">
  <h1>Header 1</h1>
  <section id="header-2" class="level2">
    <h2>Header 2</h2>
    <section id="header-3" class="level3">
      <h3>Header 3</h3>
      <section id="header-4" class="level4">
        <h4>Header 4</h4>
        <section id="header-5" class="level5">
          <h5>Header 5</h5>
          <section id="header-6" class="level6">
            <h6>Header 6</h6>
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
  const md = `# Header 1 {.depth1}
## Header 2 {.depth2}
### Header 3 {.depth3}
#### Header 4 {.depth4}
##### Header 5 {.depth5}
###### Header 6 {.depth6}`;
  const received = stringify(md, { partial: true });
  const expected = `
<section class="level1 depth1" id="header-1">
  <h1>Header 1</h1>
  <section class="level2 depth2" id="header-2">
    <h2>Header 2</h2>
    <section class="level3 depth3" id="header-3">
      <h3>Header 3</h3>
      <section class="level4 depth4" id="header-4">
        <h4>Header 4</h4>
        <section class="level5 depth5" id="header-5">
          <h5>Header 5</h5>
          <section class="level6 depth6" id="header-6">
            <h6>Header 6</h6>
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
  const md = `# Header 1
## Header 2 {.foo}
# Header 1`;
  const received = stringify(md, { partial: true });
  const expected = `
<section id="header-1" class="level1">
  <h1>Header 1</h1>
  <section class="level2 foo" id="header-2">
    <h2>Header 2</h2>
  </section>
</section>
<section id="header-1-1" class="level1">
  <h1>Header 1</h1>
</section>
`;
  expect(received).toBe(expected);
});
