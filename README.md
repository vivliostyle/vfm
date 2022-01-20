![Vivliostyle Flavored Markdown](https://raw.githubusercontent.com/vivliostyle/vfm/master/assets/cover.png)

[![Actions Status: test](https://github.com/vivliostyle/vfm/workflows/CI/badge.svg)](https://github.com/vivliostyle/vfm/actions?query=CI)
[![npm-badge](https://flat.badgen.net/npm/v/@vivliostyle/vfm)][npm-url]
[![npm: total downloads](https://flat.badgen.net/npm/dt/@vivliostyle/vfm)][npm-url]
![npm: license](https://flat.badgen.net/npm/license/@vivliostyle/vfm)

[npm-url]: https://npmjs.org/package/@vivliostyle/vfm

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects.

## Table of contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Install](#install)
- [Use](#use)
  - [Usage with `vivliostyle` command](#usage-with-vivliostyle-command)
- [API](#api)
  - [Options](#options)
    - [`style` (default: `undefined`)](#style-default-undefined)
    - [`partial` (default: `false`)](#partial-default-false)
    - [`title` (default: `undefined`)](#title-default-undefined)
    - [`language` (default: `undefined`)](#language-default-undefined)
    - [`hardLineBreaks` (default: `false`)](#hardlinebreaks-default-false)
    - [`disableFormatHtml` (default: `false`)](#disableformathtml-default-false)
    - [`math` (default: `true`)](#math-default-true)
  - [Advanced usage](#advanced-usage)
    - [Unified processor](#unified-processor)
    - [Unified plugin](#unified-plugin)
    - [readMetadata](#readmetadata)
    - [User-specified metadata](#user-specified-metadata)
- [Spec](#spec)
  - [Principles](#principles)
  - [Links](#links)
- [Contribution](#contribution)
  - [Maintainers](#maintainers)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

```bash
npm install -g @vivliostyle/vfm
```

## Use

```bash
vfm --help
vfm README.md
echo "# Hello" | vfm
```

### Usage with `vivliostyle` command

```bash
npm i -g @vivliostyle/cli
vfm README.md --style https://raw.githubusercontent.com/jagat-xpub/cosmology/gh-pages/css/scholarly.css > book.html
vivliostyle build book.html -s A4
```

## API

```bash
npm install --save @vivliostyle/vfm
# or
yarn add @vivliostyle/vfm
```

```js
import { stringify } from '@vivliostyle/vfm';

console.log(
  stringify(`
# はじめに

{Vivliostyle|ビブリオスタイル}の世界へようこそ。
`),
);
```

This snippet will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>はじめに</title>
  </head>
  <body>
    <h1>はじめに</h1>
    <p>
      <ruby>Vivliostyle<rt>ビブリオスタイル</rt></ruby
      >の世界へようこそ。
    </p>
  </body>
</html>
```

### Options

#### `style` (default: `undefined`)

Set the specified value as the `href` attribute of `<link rel="stylesheet">`.

```js
stringify('# Hello', { style: 'https://example.com/book.css' });
```

will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://example.com/book.css" />
  </head>
  <body>
    <p><h1>Hello</h1></p>
  </body>
</html>
```

`style` can be an array of styles.

```js
stringify('# Hello', {
  style: ['https://example.com/book.css', 'https://example.com/extra.css'],
});
```

will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://example.com/book.css" />
    <link rel="stylesheet" href="https://example.com/extra.css" />
  </head>
  <body>
    <p><h1>Hello</h1></p>
  </body>
</html>
```

#### `partial` (default: `false`)

If `true` is specified, only the HTML defined in `<body>` is output.

```js
stringify('# Hello', { partial: true });
```

will generates:

```html
<p><h1>Hello</h1></p>
```

#### `title` (default: `undefined`)

Set the specified value as the text of `<title>`.

```js
stringify('# Hello', { title: 'Hello' });
```

will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Hello</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p><h1>Hello</h1></p>
  </body>
</html>
```

#### `language` (default: `undefined`)

Set the specified value as the `lang` attribute of `<html>`.

```js
stringify('# Hello', { language: 'ja' });
```

will generates:

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p><h1>Hello</h1></p>
  </body>
</html>
```

#### `hardLineBreaks` (default: `false`)

Converts line breaks to `<br>`.

```js
stringify(
  `
new
line
`,
  { hardLineBreaks: true },
);
```

will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p>
      new<br />
      line
    </p>
  </body>
</html>
```

#### `disableFormatHtml` (default: `false`)

Disable automatic HTML format. Explicitly specify true if want unformatted HTML during development or debug.

```js
stringify(
  `text`,
  { disableFormatHtml: true },
);
```

will generates:

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<p>text</p>
</body>
</html>
```

#### `math` (default: `true`)

Handles math syntax. The default value is `true`, which is valid.

```js
stringify(
  `$x = y$`
);
```

will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML"></script>
  </head>
  <body data-math-typeset="true">
    <p><span class="math inline">\(x = y\)</span></p>
  </body>
</html>
```

To explicitly disable it, specify `false` for this option or `math: false` for Markdown's Frontmatter.

```js
stringify(
  `$x = y$`,
  { math: false }
);
```

will generates:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <p>$x = y$</p>
  </body>
</html>
```

### Advanced usage

#### Unified processor

```js
import { VFM } from '@vivliostyle/vfm';

const processor = VFM({ partial: true });
const html = processor.processSync('# Hello').toString();
```

#### Unified plugin

```js
import unified from 'unified';
import vfm from '@vivliostyle/vfm/lib/revive-parse';
import html from '@vivliostyle/vfm/lib/revive-rehype';

function main() {
  unified()
    .use(vfm)
    .use(customRemarkPlugin)
    .use(html)
    .use(customRehypePlugin)
    .processSync('# Hello');
}
```

#### readMetadata

Read metadata from Markdown frontmatter.

Useful if just want to get the metadata, Markdown parse and metadata typing (for TypeScript) are handled by the VFM side.

`readMetadata(md: string, customKeys: string[]): Metadata`

- params:
  - `md`: `String` Markdown text.
  - `customKeys`: `String[]` A collection of key names to be ignored by meta processing.
- returns:
  - `metadata`: `Metadata` Metadata.

```js
import { readMetadata } from '@vivliostyle/vfm'

const md = `---
id: 'my-page'
lang: 'en'
dir: 'ltr'
class: 'my-class'
title: 'Title'
vfm:
  math: false
  theme: 'sample.css'
---
`;

const metadata = readMetadata(md);
console.log(metadata);
```

About `Metadata` details, refer to [VFM](https://vivliostyle.github.io/vfm/#/vfm)'s "Frontmatter" or type information of TypeScript.

**About `customKeys`**

Use this if want to add custom metadata with a third party tool.

Keys that are not defined as VFM are treated as `meta`. If you specify a key name in `customKeys`, the key and its data type will be preserved and stored in `custom` instead of `meta`.

```js
import { readMetadata } from '@vivliostyle/vfm'

const md = `---
title: 'Title'
tags: ['foo', 'bar']
---
`;

const metadata = readMetadata(md, ['tags']);
console.log(metadata);
```

Results:

```js
{
  title: 'title',
  custom: {
    tags: ['foo', 'bar']
  }
}
```

`tags` is stored and retained structure in `custom` instead of `meta`.

If specify a default key such as `title`, it will be processed as `custom`.

#### User-specified metadata

Metadata can be specified for `stringify`, this specification takes precedence over Frontmatter. 

The following usage is assumed.

- Use metadata other than Frontmatter
- Process Frontmatter metadata obtained by `readMetadata` 

```js
stringify(
  '# Title',
  {},
  { title: 'My Page', body: [{ name: 'id', value: 'page' }] },
);
```

HTML:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>My Page</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body id="page">
    <section id="title" class="level1">
      <h1>Title</h1>
    </section>
  </body>
</html>
```

## Spec

[Current Status](https://github.com/vivliostyle/vfm/projects/1)

### Principles

1. **Open**: steadily improving through open discussion and feedback from the vast community.
1. **Consistent**: Provides reference implementation for parsing and converting VFM to HTML, allowing other non Vivliostyle projects to use this syntax for their purposes.

### Links

- [Vivliostyle Flavored Markdown](https://vivliostyle.github.io/vfm/#/vfm)
- [Theme Design Guidelines](https://github.com/vivliostyle/themes/tree/master/DESIGN.md)

## Contribution

We want you to:

- Join [Discussion](https://github.com/vivliostyle/vfm/issues) to improve spec
- Implement [alpha-stage specs](https://github.com/vivliostyle/vfm/issues?q=is%3Aissue+is%3Aopen+label%3Astage%3Aalpha) and send a PR
- Test [beta-stage features](https://github.com/vivliostyle/vfm/issues?q=is%3Aissue+is%3Aopen+label%3Astage%3Abeta) and report a bug

[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/0)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/0)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/1)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/1)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/2)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/2)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/3)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/3)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/4)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/4)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/5)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/5)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/6)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/6)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/7)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/7)

### Maintainers

- [Akabeko](https://github.com/akabekobeko)
- [Yasuaki Uechi](https://github.com/uetchy)
