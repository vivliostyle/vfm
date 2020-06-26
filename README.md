![Vivliostyle Flavored Markdown](https://raw.githubusercontent.com/vivliostyle/vfm/master/assets/cover.png)

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects.

## Table of contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Use](#use)
  - [Usage with `vivliostyle` command](#usage-with-vivliostyle-command)
- [API](#api)
  - [Options](#options)
    - [`stylesheet` (default: `undefined`)](#stylesheet-default-undefined)
    - [`partial` (default: `false`)](#partial-default-false)
    - [`title` (default: `undefined`)](#title-default-undefined)
  - [Advanced usage](#advanced-usage)
    - [Integrate into Unified.js pipeline](#integrate-into-unifiedjs-pipeline)
- [Spec](#spec)
  - [Principles](#principles)
  - [Links](#links)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Use

```bash
npx @vivliostyle/vfm --help
npx @vivliostyle/vfm input.md
echo "# Hello" | npx @vivliostyle/vfm

# or install it globally
npm i -g @vivliostyle/vfm
vfm input.md
```

### Usage with `vivliostyle` command

```bash
npm i -g @vivliostyle/vfm @vivliostyle/cli
vfm README.md --stylesheet https://raw.githubusercontent.com/jagat-xpub/cosmology/gh-pages/css/scholarly.css > book.html
vivliostyle build book.html -s A4
```

## API

```bash
yarn add @vivliostyle/vfm
```

```js
const {stringify} = require('@vivliostyle/vfm');

console.log(
  stringify(`
# はじめに

{Vivliostyle|ビブリオスタイル}の世界へようこそ。
`),
);
```

This snippet will generates:

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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

#### `stylesheet` (default: `undefined`)

```js
stringify('# Hello', {stylesheet: 'https://example.com/book.css'});
```

will generates:

```html
<!DOCTYPE html>
<html lang="ja">
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

#### `partial` (default: `false`)

```js
stringify('# Hello', {partial: true});
```

will generates:

```html
<p><h1>Hello</h1></p>
```

#### `title` (default: `undefined`)

```js
stringify('# Hello', {title: 'Hello'});
```

will generates:

```html
<!DOCTYPE html>
<html lang="ja">
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

### Advanced usage

#### Integrate into Unified.js pipeline

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

## Spec

### Principles

1. **Open**: steadily improving through open discussion and feedback from the vast community.
1. **Consistent**: Provides reference implementation for parsing and converting VFM to HTML, allowing other non Vivliostyle projects to use this syntax for their purposes.

### Links

- [Discussion](https://github.com/vivliostyle/vfm/issues/1)
- [Vivliostyle Flavored Markdown](https://vivliostyle.github.io/vfm/#/vfm)
- [Theme Design Guidelines](https://github.com/vivliostyle/themes/tree/master/DESIGN.md)
