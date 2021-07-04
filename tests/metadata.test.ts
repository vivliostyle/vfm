import { stringify } from '../src/index';
import { readMetadata } from '../src/plugins/metadata';

it('Read all', () => {
  const received = readMetadata(
    `---
id: 'my-page'
lang: 'ja'
dir: 'ltr'
class: 'my-class'
title: 'Title'
html:
  data-color-mode: 'dark'
  data-light-theme: 'light'
  data-dark-theme: 'dark'
body:
  id: 'body'
  class: 'body'
base:
  target: '_top'
  href: 'https://www.example.com/'
meta:
  - name: 'theme-color'
    media: '(prefers-color-scheme: light)'
    content: 'red'
  - name: 'theme-color'
    media: '(prefers-color-scheme: dark)'
    content: 'darkred'
link:
  - rel: 'stylesheet'
    href: 'sample1.css'
  - rel: 'stylesheet'
    href: 'sample2.css'
script:
  - type: 'text/javascript'
    src: 'sample1.js'
  - type: 'text/javascript'
    src: 'sample2.js'
vfm:
  math: false
  partial: true
  hardLineBreaks: true
  disableFormatHtml: true
  theme: 'theme.css'
author: 'Author'
other-meta1: 'other1'
other-meta2: 'other2'
---

`,
  );
  const expected = {
    id: 'my-page',
    lang: 'ja',
    dir: 'ltr',
    class: 'my-class',
    title: 'Title',
    html: [
      { name: 'data-color-mode', value: 'dark' },
      { name: 'data-light-theme', value: 'light' },
      { name: 'data-dark-theme', value: 'dark' },
    ],
    body: [
      { name: 'id', value: 'body' },
      { name: 'class', value: 'body' },
    ],
    base: [
      { name: 'target', value: '_top' },
      { name: 'href', value: 'https://www.example.com/' },
    ],
    meta: [
      [
        { name: 'name', value: 'theme-color' },
        { name: 'media', value: '(prefers-color-scheme: light)' },
        { name: 'content', value: 'red' },
      ],
      [
        { name: 'name', value: 'theme-color' },
        { name: 'media', value: '(prefers-color-scheme: dark)' },
        { name: 'content', value: 'darkred' },
      ],
      [
        { name: 'name', value: 'author' },
        { name: 'content', value: 'Author' },
      ],
      [
        { name: 'name', value: 'other-meta1' },
        { name: 'content', value: 'other1' },
      ],
      [
        { name: 'name', value: 'other-meta2' },
        { name: 'content', value: 'other2' },
      ],
    ],
    link: [
      [
        { name: 'rel', value: 'stylesheet' },
        { name: 'href', value: 'sample1.css' },
      ],
      [
        { name: 'rel', value: 'stylesheet' },
        { name: 'href', value: 'sample2.css' },
      ],
    ],
    script: [
      [
        { name: 'type', value: 'text/javascript' },
        { name: 'src', value: 'sample1.js' },
      ],
      [
        { name: 'type', value: 'text/javascript' },
        { name: 'src', value: 'sample2.js' },
      ],
    ],
    vfm: {
      math: false,
      partial: true,
      hardLineBreaks: true,
      disableFormatHtml: true,
      toc: false,
      theme: 'theme.css',
    },
  };

  expect(received).toStrictEqual(expected);
});

it('Title from heading', () => {
  const received = readMetadata(`# Heading Title`);
  const expected = 'Heading Title';

  expect(received.title).toBe(expected);
});

it('Title from heading with frontmatter', () => {
  const received = readMetadata(
    `---
title: 'Title'
---

# Heading Title
`,
  );
  const expected = 'Title';

  expect(received.title).toBe(expected);
});

it('All documents', () => {
  const md = `---
id: 'my-page'
lang: 'ja'
dir: 'ltr'
class: 'my-class'
title: 'Title'
html:
  data-color-mode: 'dark'
  data-light-theme: 'light'
  data-dark-theme: 'dark'
body:
  id: 'body'
  class: 'foo bar'
base:
  target: '_top'
  href: 'https://www.example.com/'
meta:
  - name: 'theme-color'
    media: '(prefers-color-scheme: light)'
    content: 'red'
  - name: 'theme-color'
    media: '(prefers-color-scheme: dark)'
    content: 'darkred'
link:
  - rel: 'stylesheet'
    href: 'sample1.css'
  - rel: 'stylesheet'
    href: 'sample2.css'
script:
  - type: 'text/javascript'
    src: 'sample1.js'
  - type: 'text/javascript'
    src: 'sample2.js'
author: 'Author'
vfm:
  math: false
  theme: 'theme.css'
---

Text
`;

  const received = stringify(md);
  const expected = `<!doctype html>
<html data-color-mode="dark" data-light-theme="light" data-dark-theme="dark" id="my-page" lang="ja" dir="ltr" class="my-class">
  <head>
    <meta charset="utf-8">
    <title>Title</title>
    <base target="_top" href="https://www.example.com/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="red">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="darkred">
    <meta name="author" content="Author">
    <link rel="stylesheet" href="sample1.css">
    <link rel="stylesheet" href="sample2.css">
    <script type="text/javascript" src="sample1.js"></script>
    <script type="text/javascript" src="sample2.js"></script>
  </head>
  <body id="body" class="foo bar">
    <p>Text</p>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

it('If the value is null or empty string, it will be an empty string', () => {
  const md = `---
id:
lang:
dir: ""
class:
title: ""
html:
  data-color-mode:
  data-light-theme:
  data-dark-theme:
body:
  id:
  class:
base:
  target:
  href:
meta:
  - name:
    media:
    content:
  - name:
    media:
    content:
link:
  - rel:
    href:
  - rel:
    href:
script:
  - type:
    src:
  - type:
    src:
author:
---

Text
  `;

  const received = stringify(md);
  const expected = `<!doctype html>
<html data-color-mode="" data-light-theme="" data-dark-theme="" id="" lang="" dir="" class="">
  <head>
    <meta charset="utf-8">
    <title></title>
    <base target="" href="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="" media="" content="">
    <meta name="" media="" content="">
    <meta name="author" content="">
    <link rel="" href="">
    <link rel="" href="">
    <script type="" src=""></script>
    <script type="" src=""></script>
  </head>
  <body id="" class="">
    <p>Text</p>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

it('Specify null or empty string for Object', () => {
  const md = `---
html: ''
meta:
  -
vfm:
---
`;
  const received = stringify(md);
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('Style from options', () => {
  const md = `---
link:
  - rel: 'stylesheet'
    href: 'sample1.css'
---
`;
  const received = stringify(md, { style: 'sample2.css' });
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="sample1.css">
    <link rel="stylesheet" href="sample2.css">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('Styles from options (String)', () => {
  const md = ``;
  const received = stringify(md, { style: 'sample.css' });
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="sample.css">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('Styles from options (String[])', () => {
  const md = ``;
  const received = stringify(md, { style: ['sample1.css', 'sample2.css'] });
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="sample1.css">
    <link rel="stylesheet" href="sample2.css">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('Styles from options with frontmatter', () => {
  const md = `---
link:
  - rel: 'stylesheet'
    href: 'sample1.css'
---
`;
  const received = stringify(md, { style: ['sample2.css', 'sample3.css'] });
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="sample1.css">
    <link rel="stylesheet" href="sample2.css">
    <link rel="stylesheet" href="sample3.css">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('Do not convert date and time', () => {
  const md = `---
date: 2021-06-27
date2: "2021-06-27"
---`;
  const received = stringify(md);
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="date" content="2021-06-27">
    <meta name="date2" content="2021-06-27">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('Reserved for future use, `style` and `head`', () => {
  const md = `---
style: |
  @media {
    p {
      color: blue;
    }
  }
head: |
  <meta name="sample-meta1" content="meta1">
  <meta name="sample-meta2" content="meta2">
---`;
  const received = stringify(md);
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body></body>
</html>
`;
  expect(received).toBe(expected);
});

it('vfm.partial: true', () => {
  const md = `---
vfm:
  partial: true
---

Text
`;
  const received = stringify(md, { partial: false });
  const expected = `
<p>Text</p>
`;
  expect(received).toBe(expected);
});

it('vfm.hardLineBreaks: true', () => {
  const md = `---
vfm:
  hardLineBreaks: true
---

Text
Text
`;
  const received = stringify(md, { hardLineBreaks: false });
  const expected = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <p>Text<br>Text</p>
  </body>
</html>
`;
  expect(received).toBe(expected);
});

it('vfm.disableFormatHtml: true', () => {
  const md = `---
vfm:
  disableFormatHtml: true
---

Text
`;
  const received = stringify(md, { disableFormatHtml: false });
  const expected = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Text</p>
</body>
</html>
`;
  expect(received).toBe(expected);
});
