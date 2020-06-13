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
