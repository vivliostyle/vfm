# @vivliostyle/vfm

## Install

```shell
yarn add @vivliostyle/vfm
```

## Usage

```js
const {stringifyMarkdown} = require('@vivliostyle/vfm');

function vfm2html(vfmString) {
  return stringifyMarkdown(vfmString);
}

console.log(
  vfm2html(`
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
    <link rel="stylesheet" href="" />
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
