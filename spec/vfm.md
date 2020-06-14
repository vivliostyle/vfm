# Vivliostyle Flavored Markdown: Working Draft

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects.

## Principles

1. Rule of least surprise
   - Should be lined and matched to another Markdown syntax.
1. (Mostly) backward-compatible syntax. should not be incorrectly rendered in Markdown editor like Typora.

## Spec

- Implemented top on CommonMark and GFM.

### Hard new line

- A newline puts `<br/>` to the end of a line.
- Consecutive 2 newlines creates a new sentence block.

**VFM**

```md
はじめまして。

Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。
VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle プロジェクトのために策定・実装されました。
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

**HTML**

```html
This is <ruby>Ruby<rt>ルビ</rt></ruby>
```

### Image

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

### Fenced block

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

**HTML**

```html
<div class="section-author">
  <p>uetchy</p>
  <div class="author-homepage">
    <a href="https://uechi.io">https://uechi.io</a>
  </div>
</div>
```

### Raw HTML

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

#### with Markdown

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

### Math equation

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
