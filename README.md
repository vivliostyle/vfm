![Vivliostyle Flavored Markdown](https://raw.githubusercontent.com/vivliostyle/vfm/master/assets/cover.png)

[![Actions Status: test](https://github.com/vivliostyle/vfm/workflows/CI/badge.svg)](https://github.com/vivliostyle/vfm/actions?query=CI)
[![npm-badge](https://flat.badgen.net/npm/v/@vivliostyle/vfm)][npm-url]
[![npm: version (tag)](https://flat.badgen.net/npm/v/@vivliostyle/vfm/next)][npm-url]
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
    - [`language` (default: `en`)](#language-default-en)
  - [Advanced usage](#advanced-usage)
    - [Unified processor](#unified-processor)
    - [Unified plugin](#unified-plugin)
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

If you want to test latest spec, run `npm install -g @vivliostyle/vfm@next` instead.

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
const { stringify } = require('@vivliostyle/vfm');

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
<html lang="en">
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

#### `style` (default: `undefined`)

```js
stringify('# Hello', { style: 'https://example.com/book.css' });
```

will generates:

```html
<!DOCTYPE html>
<html lang="en">
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
<!DOCTYPE html>
<html lang="en">
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

```js
stringify('# Hello', { partial: true });
```

will generates:

```html
<p><h1>Hello</h1></p>
```

#### `title` (default: `undefined`)

```js
stringify('# Hello', { title: 'Hello' });
```

will generates:

```html
<!DOCTYPE html>
<html lang="en">
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

#### `language` (default: `en`)

```js
stringify('# Hello', { language: 'ja' });
```

will generates:

```html
<!DOCTYPE html>
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

## Spec

### Principles

1. **Open**: steadily improving through open discussion and feedback from the vast community.
1. **Consistent**: Provides reference implementation for parsing and converting VFM to HTML, allowing other non Vivliostyle projects to use this syntax for their purposes.

### Links

- [Vivliostyle Flavored Markdown](https://vivliostyle.github.io/vfm/#/vfm)
- [Theme Design Guidelines](https://github.com/vivliostyle/themes/tree/master/DESIGN.md)

## Contribution

- Join [Discussion](https://github.com/vivliostyle/vfm/issues)
- Implement [alpha-stage specs](https://github.com/vivliostyle/vfm/issues?q=is%3Aissue+is%3Aopen+label%3Astage%3Aalpha)

[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/0)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/0)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/1)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/1)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/2)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/2)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/3)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/3)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/4)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/4)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/5)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/5)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/6)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/6)[![](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/images/7)](https://sourcerer.io/fame/uetchy/vivliostyle/vfm/links/7)

### Maintainers

- [Yasuaki Uechi](https://github.com/uetchy)
