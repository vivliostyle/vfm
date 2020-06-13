# Vivliostyle Flavored Markdown: Working Draft

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects.

## Principles

1. Rule of least surprise
   - Should be lined and matched to another Markdown syntax.
1. (Mostly) backward-compatible syntax. should not be incorrectly rendered in Markdown editor like Typora.

## Spec

### Caveats

- `position` is omitted in `mdast`.

### Sentence

- A newline puts `<br/>` to the end of a line.
- Consecutive 2 newlines creates a new sentence block.

**VFM**

```md
はじめまして。

Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。
VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle プロジェクトのために策定・実装されました。
```

**mdast**

```json
[
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
        "value": "VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle プロジェクトのために策定・実装されました。"
      }
    ]
  }
]
```

**HTML**

```html
<p>はじめまして。</p>
<p>
  Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。<br />
  VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle
  プロジェクトのために策定・実装されました。
</p>
```

### Heading

**VFM**

```md
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
```

**mdast**

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

...

{
  "type": "heading",
  "depth": 6,
  "children": [
    {
      "type": "text",
      "value": "Heading 6"
    }
  ]
}
```

**HTML**

```html
<h1>Heading 1</h1>
...
<h6>Heading 6</h6>
```

### Code

**VFM**

````md
```javascript:app.js
function main() {}
```
````

**mdast**

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

**HTML**

```html
<pre>
  <code class="language-javascript">
    function main() {}
  </code>
</pre>
```

#### Dictionary-style metadata

**VFM**

````md
```javascript:title=app.js
function main() {}
```
````

**mdast**

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

**HTML**

```html
<pre>
  <code class="language-javascript">
    function main() {}
  </code>
</pre>
```

### Ruby

**VFM**

```
This is {Ruby|ルビ}
```

**mdast**

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

**HTML**

```html
This is <ruby>Ruby<rt>ルビ</rt></ruby>
```

### Image

**VFM**

```md
![Figure 1](./fig1.png)
```

**mdast**

```json
{
  "type": "image",
  "title": null,
  "url": "./fig1.png",
  "alt": "Figure 1"
}
```

**HTML**

```html
<img src="./fig1.png" alt="Figure 1" />
```

### Fenced block

- Fenced block populates a class labelled `<div>` element with its contents.
- Inner contents will be parsed as VFM.
- Notation candidates: `===`, `~~~`, `:::`

**VFM**

```md
:::section-author
uetchy
:::
```

**mdast**

```json
{
  "type": "fencedBlock",
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

**HTML**

```html
<div class="section-author">
  <p>uetchy</p>
</div>
```

#### Nested fenced block

**VFM**

```md
:::section-author
uetchy
::::author-homepage
<https://uechi.io>
::::
:::
```

**mdast**

```json
{
  "type": "fencedBlock",
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
      "type": "fencedBlock",
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

**HTML**

```html
<div class="section-author">
  <p>uetchy</p>
  <div class="author-homepage">
    <a href="https://uechi.io">https://uechi.io</a>
  </div>
</div>
```

#### Custom HTML

**VFM**

```markdown
<div class="custom">
  <p>Hey</p>
</div>
```

**mdast**

```json
{
  "type": "html",
  "value": "<div class=\"custom\">\n<p>Hey</p>\n</div>"
}
```

**HTML**

```html
<div class="custom">
  <p>Hey</p>
</div>
```

### Frontmatter

Frontmatter is a way of defining metadata in Markdown (file) units.

```yaml
---
title: Introduction to VFM
---

```

#### Reserved words

| Property | Type   | Description                                                                                                                                                                                    |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title    | String | The title of the document. Markdown The first `#` can be a title, but this is not always defined, so I want an explicit title. This SHOULD be treated as section title and MAY be used in ToC. |
| author   | String | Author of the document.                                                                                                                                                                        |
| layout   | String | Custom CSS file for the document.                                                                                                                                                              |

## References

- [mdast](https://github.com/syntax-tree/mdast)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [CommonMark Spec](https://spec.commonmark.org/)
- [PHP Markdown Extra](https://michelf.ca/projects/php-markdown/extra/)
- [Pandoc's Markdown](https://pandoc.org/MANUAL.html#pandocs-markdown)
- [でんでんマークダウン](https://conv.denshochan.com/markdown)
- [remark](https://github.com/remarkjs/remark)
- [remark-rehype](https://github.com/remarkjs/remark-rehype)
- [env-create-book](https://github.com/akabekobeko/env-create-book)
- [dewriteful](https://github.com/pentapod/dewriteful)
