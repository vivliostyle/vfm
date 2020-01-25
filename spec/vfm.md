# Vivliostyle Flavoured Markdown Draft

Draft of Vivliostyle Flavored Markdown (VFM), a custom Markdown syntax specialized in book authoring.

## Principles

### VFM

1. Rule of least surprise.
   1. Should be lined and matched to another Markdown syntax.
1. **Not intended** to be a superset/subset of either CommonMark or GFM.
1. Backward compatible syntax (should not be incorrectly rendered in Markdown editor like Typora).

### HTML

- Follows [WCAG 2.1](https://www.w3.org/TR/WCAG21/).

## Spec

### Caveats

- `position` is omitted in `mdast`.

### Sentence

- A newline puts `<br/>` to the end of a line.
- Consecutive 2 newlines creates new sentence block.

```md
はじめまして。

Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。
VFM は日本語の執筆に特化した Markdown の亜種であり、Vivliostyle プロジェクトのために策定・実装されました。
```

```json
{
  "type": "root",
  "children": [
    {
      "type": "paragraph",
      "children": [
        {
          "type": "text",
          "value": "はじめまして。"
        }
      ]
    },
    {
      "type": "paragraph",
      "children": [
        {
          "type": "text",
          "value": "Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。"
        },
        {
          "type": "break"
        },
        {
          "type": "text",
          "value": "VFM は日本語の執筆に特化した Markdown の亜種であり、Vivliostyle プロジェクトのために策定・実装されました。"
        }
      ]
    }
  ]
}
```

```html
<p>はじめまして。</p>
<p>
  Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。<br />
  VFM は日本語の執筆に特化した Markdown の亜種であり、Vivliostyle
  プロジェクトのために策定・実装されました。
</p>
```

### Heading

```md
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
```

```json
{
  "type": "heading",
  "depth": 1,
  "children": [
    {
      "type": "text",
      "value": "Heading 1"
    }
  ]
}

{
  "type": "heading",
  "depth": 2,
  "children": [
    {
      "type": "text",
      "value": "Heading 2"
    }
  ]
}
```

```html
<h1>Heading 1</h1>
```

### Code

````md
```javascript:app.js
function main() {}
```
````

```json
{
  "type": "code",
  "lang": "javascript",
  "meta": {
    "title": "app.js"
  },
  "value": "function main() {}"
}
```

````md
```javascript:title=app.js
function main() {}
```
````

```json
{
  "type": "code",
  "lang": "javascript",
  "meta": {
    "title": "app.js"
  },
  "value": "function main() {}"
}
```

```html
<pre>
  <code class="language-javascript">
    function main() {}
  </code>
</pre>
```

### Ruby

```
This is [Ruby]{ルビ}
```

```json
{
  "type": "ruby",
  "rubyText": "ルビ",
  "children": [
    {
      "type": "text",
      "value": "Ruby"
    }
  ]
}
```

```html
This is <ruby>Ruby<rt>ルビ</rt></ruby>
```

#### Other candidates

##### `{電子出版|でんししゅっぱん}`

The notation from [Denden Markdown](https://conv.denshochan.com/markdown#ruby).

- `More comments needed`

##### `｜Text《Ruby》`

The notation from [なろう](https://syosetu.com/man/ruby/).

- 🔻 avoid Unicode character

##### `[Text]<Ruby>`

- 🔻disambiguate with `<URL>`
```

### Positional Image

#### Two-column images

```markdown
![Column 1](./image1.png)![Column 2](./image2.png)
```

### Frontmatter

- `title`, `layout` are **reserved metatags**.
- `title` SHOULD be treated as section title and MAY be used in ToC.
- metatags other than reserved metatags can be used for arbitorary usage.

```markdown
---
title: Introduction to VFM
layout: base
---
```

### Page Layout

```md
---
layout: base
---
```

- title: Title of the book
- content: Rendered VFM

```html
<!DOCTYPE html>
<html lang="{{lang}}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={{width}}, initial-scale=1.0" />
    <title>{{title}}</title>
  </head>
  <body>
    {{content}}
  </body>
</html>
```

### Walled block

- Walled block populates a class labeled `<div>` element with its contents.
- Inner contents will be parsed as VFM.
- Notation candidates: `===`, `~~~`

```md
===section-author
uetchy
===
```

```json
{
  "type": "walledBlock",
  "className": "section-author",
  "children": [
    {
      "type": "paragraph",
      "children": [
        {
          "type": "text",
          "value": "uetchy"
        }
      ]
    }
  ]
}
```

```html
<div class="section-author">
  <p>uetchy</p>
</div>
```

#### Nested walled block

```md
===section-author
uetchy
====author-homepage
<https://uechi.io>
====
===
```

```json
{
  "type": "walledBlock",
  "className": "section-author",
  "children": [
    {
      "type": "paragraph",
      "children": [
        {
          "type": "text",
          "value": "uetchy"
        }
      ]
    },
    {
      "type": "walledBlock",
      "className": "author-homepage",
      "children": [
        {
          "type": "link",
          "title": null,
          "url": "https://uechi.io",
          "children": [
            {
              "type": "text",
              "value": "https://uechi.io"
            }
          ]
        }
      ]
    }
  ]
}
```

```html
<div class="section-author">
  <p>uetchy</p>
  <div class="author-homepage">
    <a href="https://uechi.io">https://uechi.io</a>
  </div>
</div>
```

#### Custom HTML

```markdown
<div class="custom">
...
</div>
```

## References

- [mdast](https://github.com/syntax-tree/mdast)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [CommonMark Spec](https://spec.commonmark.org/)
- [PHP Markdown Extra](https://michelf.ca/projects/php-markdown/extra/)
- [remark](https://github.com/remarkjs/remark)
- [remark-rehype](https://github.com/remarkjs/remark-rehype)
- [env-create-book](https://github.com/akabekobeko/env-create-book)
- [dewriteful](https://github.com/pentapod/dewriteful)
