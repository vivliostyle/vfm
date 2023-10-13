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
<section class="level1" aria-labelledby="id1">
  <h1 id="id1" class="class1" key1="value1">こんにちは</h1>
</section>
`;
  expect(received).toBe(expected);
});

it('Heading with hidden attribute', () => {
  const md = '# Heading {hidden}';
  const received = stringify(md, { partial: true, disableFormatHtml: true });
  const expected =
    '<section class="level1" aria-labelledby="heading"><h1 hidden id="heading">Heading</h1></section>';
  expect(received).toBe(expected);
});

it('Disable section with blockquote heading', () => {
  const md = '> # Not Sectionize';
  const received = stringify(md, { partial: true });
  const expected = `
<blockquote>
  <h1 id="not-sectionize">Not Sectionize</h1>
</blockquote>
`;
  expect(received).toBe(expected);
});

it('Disable section with closing hashes', () => {
  const md = '### Not Sectionize ###';
  const received = stringify(md, { partial: true });
  const expected = `
<h3 id="not-sectionize">Not Sectionize</h3>
`;
  expect(received).toBe(expected);
});

it('Do not disable section with insufficient closing hashes', () => {
  const md = '### Sectionize ##';
  const received = stringify(md, { partial: true });
  const expected = `
<section class="level3" aria-labelledby="sectionize">
  <h3 id="sectionize">Sectionize</h3>
</section>
`;
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
<section class="level1" aria-labelledby="heading-1">
  <h1 id="heading-1">Heading 1</h1>
  <section class="level2" aria-labelledby="heading-2">
    <h2 id="heading-2">Heading 2</h2>
    <section class="level3" aria-labelledby="heading-3">
      <h3 id="heading-3">Heading 3</h3>
      <section class="level4" aria-labelledby="heading-4">
        <h4 id="heading-4">Heading 4</h4>
        <section class="level5" aria-labelledby="heading-5">
          <h5 id="heading-5">Heading 5</h5>
          <section class="level6" aria-labelledby="heading-6">
            <h6 id="heading-6">Heading 6</h6>
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
<section class="level1" aria-labelledby="heading-1">
  <h1 class="depth1" id="heading-1">Heading 1</h1>
  <section class="level2" aria-labelledby="heading-2">
    <h2 class="depth2" id="heading-2">Heading 2</h2>
    <section class="level3" aria-labelledby="heading-3">
      <h3 class="depth3" id="heading-3">Heading 3</h3>
      <section class="level4" aria-labelledby="heading-4">
        <h4 class="depth4" id="heading-4">Heading 4</h4>
        <section class="level5" aria-labelledby="heading-5">
          <h5 class="depth5" id="heading-5">Heading 5</h5>
          <section class="level6" aria-labelledby="heading-6">
            <h6 class="depth6" id="heading-6">Heading 6</h6>
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
<section class="level1" aria-labelledby="heading-1">
  <h1 id="heading-1">Heading 1</h1>
  <section class="level2" aria-labelledby="heading-2">
    <h2 class="foo" id="heading-2">Heading 2</h2>
  </section>
</section>
<section class="level1" aria-labelledby="heading-1-1">
  <h1 id="heading-1-1">Heading 1</h1>
</section>
`;
  expect(received).toBe(expected);
});

it('Sample', () => {
  const md = `# Plain

  # Introduction {#intro}
  
  # Welcome {.title}
  
  # Level 1
  
  ## Level 2
  
  > # Not Sectionize`;
  const received = stringify(md, { partial: true });
  const expected = `
<section class="level1" aria-labelledby="plain">
  <h1 id="plain">Plain</h1>
</section>
<section class="level1" aria-labelledby="intro">
  <h1 id="intro">Introduction</h1>
</section>
<section class="level1" aria-labelledby="welcome">
  <h1 class="title" id="welcome">Welcome</h1>
</section>
<section class="level1" aria-labelledby="level-1">
  <h1 id="level-1">Level 1</h1>
  <section class="level2" aria-labelledby="level-2">
    <h2 id="level-2">Level 2</h2>
    <blockquote>
      <h1 id="not-sectionize">Not Sectionize</h1>
    </blockquote>
  </section>
</section>
`;
  expect(received).toBe(expected);
});

it('HTML block with headings', () => {
  const md = `# Heading 1

## Heading 2-1

<aside class="note">

### NOTE

This is a note.

</aside>

## Heading 2-2`;
  const received = stringify(md, { partial: true });
  const expected = `
<section class="level1" aria-labelledby="heading-1">
  <h1 id="heading-1">Heading 1</h1>
  <section class="level2" aria-labelledby="heading-2-1">
    <h2 id="heading-2-1">Heading 2-1</h2>
    <aside class="note">
      <section class="level3" aria-labelledby="note">
        <h3 id="note">NOTE</h3>
        <p>This is a note.</p>
      </section>
    </aside>
  </section>
  <section class="level2" aria-labelledby="heading-2-2">
    <h2 id="heading-2-2">Heading 2-2</h2>
  </section>
</section>
`;
  expect(received).toBe(expected);
});

it('Section-end marks', () => {
  const md = `# Heading 1

Depth 1

## Heading 2

Depth 2

### Heading 3

Depth 3

#### Heading 4

Depth 4

##### Heading 5

Depth 5

###### Heading 6

Depth 6

######

Depth 5 again

####

Depth 3 again

##

Depth 1 again`;
  const received = stringify(md, { partial: true });
  const expected = `
<section class="level1" aria-labelledby="heading-1">
  <h1 id="heading-1">Heading 1</h1>
  <p>Depth 1</p>
  <section class="level2" aria-labelledby="heading-2">
    <h2 id="heading-2">Heading 2</h2>
    <p>Depth 2</p>
    <section class="level3" aria-labelledby="heading-3">
      <h3 id="heading-3">Heading 3</h3>
      <p>Depth 3</p>
      <section class="level4" aria-labelledby="heading-4">
        <h4 id="heading-4">Heading 4</h4>
        <p>Depth 4</p>
        <section class="level5" aria-labelledby="heading-5">
          <h5 id="heading-5">Heading 5</h5>
          <p>Depth 5</p>
          <section class="level6" aria-labelledby="heading-6">
            <h6 id="heading-6">Heading 6</h6>
            <p>Depth 6</p>
          </section>
          <p>Depth 5 again</p>
        </section>
      </section>
      <p>Depth 3 again</p>
    </section>
  </section>
  <p>Depth 1 again</p>
</section>
`;
  expect(received).toBe(expected);
});
