# Theming Guideline (Draft)

## vivliostyle.config.js

```js
module.exports = {
  theme: '<theme>',
};
```

## `theme`

### Source

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

#### local

```js
module.exports = {
  theme: './theme-package',
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
      "stylesheet": "./theme.css"
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

- `doc-abstract` (Abstract / Summary)
- `doc-acknowledgements` (Acknowledgements)
- `doc-afterword`
- `doc-appendix` (Appendix)
- `doc-backlink` (Back link)
- `doc-biblioentry`
- `doc-bibliography`
- `doc-biblioref`
- `doc-chapter` (Chapter)
- `doc-colophon`
- `doc-conclusion` (Conclusion)
- `doc-cover` (Cover)
- `doc-credit` (Credit list item)
- `doc-credits` (Credits)
- `doc-dedication`
- `doc-endnote`
- `doc-endnotes`
- `doc-epigraph`
- `doc-epilogue` (Epilogue)
- `doc-errata` (Errata)
- `doc-example` (Example)
- `doc-footnote` (Foot note)
- `doc-foreword`
- `doc-glossary` (Glossary)
- `doc-glossref`
- `doc-index`
- `doc-introduction` (Introductory section)
- `doc-noteref`
- `doc-notice` (Notice)
- `doc-pagebreak`
- `doc-pagelist`
- `doc-part`
- `doc-preface` (Preface)
- `doc-prologue` (Prologue)
- `doc-pullquote`
- `doc-qna` (Q&A)
- `doc-subtitle` (Sub title)
- `doc-tip` (Tips)
- `doc-toc` (Table of Contents)

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
