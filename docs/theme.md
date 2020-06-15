# Theming Guideline (Draft)

## vivliostyle.config.js

```js
module.exports = {
  entrypoint: './articles/index.md',
  theme: '<theme>',
  vfm: true, // automatically set `true` when `entrypoint` points to .md file.
};
```

### `theme`

#### npm

`vivliostyle-theme-` prefix will be omitted.

```js
module.exports = {
  theme: 'academic', // npm i vivliostyle-theme-academic
  // or theme: 'vivliostyle-theme-academic'
};
```

```js
module.exports = {
  theme: '@vivliostyle/theme-academic', // npm i @vivliostyle/theme-academic
};
```

#### single-source CSS

```js
module.exports = {
  theme: 'https://example.com/theme.css',
};
```

#### local

```js
module.exports = {
  theme: './vivliostyle-theme-academic',
};
```

## Theme Package

```
vivliostyle-theme-academic
|- theme.css
|- package.json
```

### package.json

```json
{
  "name": "vivliostyle-theme-academic",
  "vivliostyle": {
    "theme": {
      "stylesheet": "./theme.css", // required
      "title": "Academic", // optional
      "author": "John Doe <john@example.com>" // optional
    }
  }
}
```

## Theme CSS Design Guide

### Data URL for smaller images

Data URL reduces the cost fetching external resources through HTTP connection.

```css
html {
  ...;
}

body: {
  background-image: url(data:...);
}
```

### `role` first, then custom classes

Take advantage of Digital Publishing WAI-ARIA `role` based blocks.
If these roles would not satisfy your use cases, now then consider using custom classes. Keep in mind that the users have to stick with your theme manual and memorize the list of class names available in your theme, which produces extra learning cost.

#### Example usage

```css
[role='doc-appendix'] {
  padding: 15px;
  background: yellow;
}

[role='doc-glossary'] {
  font-family: monospace;
}
```

#### Available roles

- `doc-abstract` (Abstract; 概要)
- `doc-acknowledgements` (Acknowledgements; 免責事項)
- `doc-afterword`
- `doc-appendix` (Appendix; 補遺)
- `doc-backlink` (Back link)
- `doc-biblioentry`
- `doc-bibliography`
- `doc-biblioref`
- `doc-chapter` (Chapter; 章)
- `doc-colophon` (Colophon; 奥付)
- `doc-conclusion` (Conclusion; 総括)
- `doc-cover` (Cover; 表紙)
- `doc-credit` (Credit list item)
- `doc-credits` (Credits)
- `doc-dedication`
- `doc-endnote`
- `doc-endnotes`
- `doc-epigraph`
- `doc-epilogue` (Epilogue; 結文)
- `doc-errata` (Errata; 正誤表)
- `doc-example` (Example; 例)
- `doc-footnote` (Foot note; フットノート)
- `doc-foreword`
- `doc-glossary` (Glossary; 用語集)
- `doc-glossref`
- `doc-index`
- `doc-introduction` (Introductory section; はじめに)
- `doc-noteref`
- `doc-notice` (Notice; 注意)
- `doc-pagebreak`
- `doc-pagelist`
- `doc-part`
- `doc-preface` (Preface; まえがき)
- `doc-prologue` (Prologue; 序文)
- `doc-pullquote`
- `doc-qna` (Q&A)
- `doc-subtitle` (Sub title; サブタイトル)
- `doc-tip` (Tips)
- `doc-toc` (Table of Contents; 目次)

### `<figure>` for captioned image

```css
/* style for non-captioned images */
img {
  width: 100%;
}

/* style for images with caption */
figure {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
figure img {
  width: 50vw;
}
figure figcaption {
  font-size: 12px;
}
```
