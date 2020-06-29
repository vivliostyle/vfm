# Vivliostyle Flavored Markdown: Working Draft

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects. VFM is implemented top on CommonMark and GFM.

## Table of contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Hard new line](#hard-new-line)
- [Code](#code)
  - [with caption](#with-caption)
- [Image](#image)
  - [with caption](#with-caption-1)
- [Ruby](#ruby)
- [Fenced block](#fenced-block)
  - [Nested fenced block](#nested-fenced-block)
  - [WAI-ARIA `role`](#wai-aria-role)
- [Raw HTML](#raw-html)
  - [with Markdown](#with-markdown)
- [Math equation](#math-equation)
- [Frontmatter](#frontmatter)
  - [Reserved words](#reserved-words)
- [Full HTML document](#full-html-document)
- [Page Layout](#page-layout)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Hard new line

<Badge type="warning">PRE-RELEASE</Badge>

- A newline puts `<br/>` to the end of a line.
- Consecutive 2 newlines creates a new sentence block.

**VFM**

```md
はじめまして。

Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。
VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle プロジェクトのために策定・実装されました。
```

## Code

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

````md
```javascript
function main() {}
```
````

**HTML**

```html
<pre>
  <code class="language-javascript">
    function main() {}
  </code>
</pre>
```

### with caption

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

````md
```javascript:app.js
function main() {}
```
````

or

````md
```javascript title=app.js
function main() {}
```
````

**HTML**

```html
<figure class="language-javascript">
  <figcaption>app.js</figcaption>
  <pre>
    <code class="language-javascript">
      function main() {}
    </code>
  </pre>
</figure>
```

## Image

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```md
![](./fig1.png)
```

**HTML**

```html
<img src="./fig1.png" />
```

### with caption

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```md
![Figure 1](./fig1.png)
```

**HTML**

```html
<figure>
  <img src="./fig1.png" alt="Figure 1" />
  <figcaption>Figure 1</figcaption>
</figure>
```

## Ruby

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```
This is {Ruby|ルビ}
```

**HTML**

```html
This is <ruby>Ruby<rt>ルビ</rt></ruby>
```

## Fenced block

<Badge type="warning">PRE-RELEASE</Badge>

- Fenced block populates a class labelled `<div>` element with its contents.
- Inner contents will be parsed as VFM.
- Notation candidates: `===`, `~~~`, `:::`

**VFM**

```md
:::author
uetchy
:::
```

**HTML**

```html
<div class="author">
  <p>uetchy</p>
</div>
```

### Nested fenced block

**VFM**

```md
:::section-author
uetchy

::::author-homepage
<https://uechi.io>
::::
:::
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

### WAI-ARIA `role`

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```md
:::@appendix

# Appendix

:::

:::@tip

# Tips

:::
```

**HTML**

```html
<section role="doc-appendix">
  <h1>Appendix</h1>
</section>

<aside role="doc-tip">
  <h1>Tips</h1>
</aside>
```

## Raw HTML

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```markdown
<div class="custom">
  <p>Hey</p>
</div>
```

**HTML**

```html
<div class="custom">
  <p>Hey</p>
</div>
```

### with Markdown

**VFM**

```markdown
<div class="custom">

# Heading

</div>
```

**HTML**

```html
<div class="custom">
  <h1>Heading</h1>
</div>
```

## Math equation

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```markdown
$$ \sum $$
```

**HTML**

```html
<p>
  <span class="math math-inline">
    <mjx-container class="MathJax" jax="SVG"
      ><!-- SVG --></svg></mjx-container
  ></span>
</p>
<!-- MathJax style -->
```

## Frontmatter

<Badge type="warning">PRE-RELEASE</Badge>

Frontmatter is a way of defining metadata in Markdown (file) units.

```yaml
---
title: Introduction to VFM
---

```

#### Reserved words

| Property                                         | Type   | Description                                                                                                                                                                                    |
| ------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title                                            | String | The title of the document. Markdown The first `#` can be a title, but this is not always defined, so I want an explicit title. This SHOULD be treated as section title and MAY be used in ToC. |
| author                                           | String | Author of the document.                                                                                                                                                                        |
| theme                                            | String | Vivliostyle Theme package or bare CSS file for the document.                                                                                                                                   |
| class <Badge type="danger">UNIMPLEMENTED</Badge> | String | Custom class applied to `<body>`                                                                                                                                                               |

## Full HTML document

<Badge type="warning">PRE-RELEASE</Badge>

- Should follows [DPUB-ARIA](https://www.w3.org/TR/dpub-aria/) and [WCAG 2.1](https://www.w3.org/TR/WCAG21/).

## Page Layout

<Badge type="warning">PRE-RELEASE</Badge>

```html
<!DOCTYPE html>
<html lang="{{language}}">
  <head>
    <meta charset="utf-8" />
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="{{stylesheet URL}}" />
  </head>
  <body class="{{class}}">
    {{HTML string}}
  </body>
</html>
```
