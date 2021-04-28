import { stringify, VFM } from '../src/index';

it('all', () => {
  const received = stringify(
    `---
title: 'Title'
author: 'Author'
class: 'my-class'
---

# Page Title
`,
  );
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="author" content="Author">
  </head>
  <body class="my-class">
    <section id="page-title" class="level1">
      <h1>Page Title</h1>
    </section>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

it('title from heading, missing "title" property of Frontmatter', () => {
  const received = stringify(`# Page Title`);
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Page Title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <section id="page-title" class="level1">
      <h1>Page Title</h1>
    </section>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

it('title from options', () => {
  const received = stringify(
    `---
author: 'Author'
class: 'my-class'
---
`,
    { title: 'Option Title' },
  );

  // HTML that matches the position of the title to be added to `rehype-document`
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Option Title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="author" content="Author">
  </head>
  <body class="my-class"></body>
</html>
`;
  expect(received).toBe(expected);
});

it('title with only frontmatter', () => {
  const md = `---
title: 'Title'
---
`;
  const received = String(VFM().processSync(md));
  // Since there is no option update that takes into account the stringify metadata,
  // `<title>` is added to the end by your own processing instead of `rehype-document`.
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Title</title>
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('overwrite optional title by frontmatter', () => {
  const received = stringify(
    `---
title: 'Title'
author: 'Author'
class: 'my-class'
---
`,
    { title: 'Option Title' },
  );

  // HTML that matches the position of the title to be added to `rehype-document`
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="author" content="Author">
  </head>
  <body class="my-class"></body>
</html>
`;
  expect(received).toBe(expected);
});

it('overwrite optional title by heading', () => {
  const received = stringify(
    `---
author: 'Author'
class: 'my-class'
---

# Heading Title
`,
    { title: 'Option Title' },
  );

  // HTML that matches the position of the title to be added to `rehype-document`
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Heading Title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="author" content="Author">
  </head>
  <body class="my-class">
    <section id="heading-title" class="level1">
      <h1>Heading Title</h1>
    </section>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

it('multiple classes', () => {
  const received = stringify(
    `---
class: 'foo bar'
---
`,
  );
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body class="foo bar"></body>
</html>
`;
  expect(received).toBe(expected);
});
