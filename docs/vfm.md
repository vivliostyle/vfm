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
- [Sectionization](#sectionization)
  - [Plain section](#plain-section)
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

**CSS**

```css
p {
}
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
<pre class="language-javascript">
<code class="language-javascript"><span class="token keyword">function</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>
</code></pre>
```

**CSS**

```css
pre {
}
pre code {
}
```

VFM uses [Prism](https://prismjs.com/) for syntax highlighting.

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

**CSS**

```css
figure[class^='language-'] {
}
figure[class^='language-'] figcaption {
}
figure[class^='language-'] pre {
}
figure[class^='language-'] pre code {
}
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

**CSS**

```css
img {
}
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

**CSS**

```css
figure img {
}
figure figcaption {
}
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

**CSS**

```css
ruby {
}
ruby rt {
}
```

## Sectionization

<Badge type="warning">PRE-RELEASE</Badge>

**VFM**

```md
# Plain

# Introduction {#intro}

# Welcome {.title}
```

**HTML**

```html
<section id="plain">
  <h1>Plain</h1>
</section>

<section id="intro">
  <h1>Introduction</h1>
</section>

<section id="welcome" class="title">
  <h1>Welcome</h1>
</section>
```

**CSS**

```css
body > section {
}
body > section > h1:first-child {
}

section.title {
}

section.title > h1:first-child {
}
```

### Plain section

<Badge type="danger">UNIMPLEMENTED</Badge>

```md
# {.author}
```

**HTML**

```html
<section class="author"></section>
```

**CSS**

```css
section.author {
}
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
$$\sum$$
```

**HTML**

```html
<p>
  <span class="math math-inline">
    <span class="katex">
      <span class="katex-html" aria-hidden="true">
        <span class="base">
          <span class="strut" style="height:0.43056em;vertical-align:0em;">
          </span>
          <span class="mord mathdefault">s</span>
          <span class="mord mathdefault">u</span>
          <span class="mord mathdefault">m</span>
        </span>
      </span>
    </span>
  </span>
</p>
```

**CSS**

```css
span.math {
}
span.math.math-inline {
}
```

## Frontmatter

<Badge type="warning">PRE-RELEASE</Badge>

Frontmatter is a way of defining metadata in Markdown (file) units.

```yaml
---
title: 'Introduction to VFM'
---

```

#### Reserved words

| Property                                          | Type   | Description                                                                                 |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| title                                             | String | Document title. If missing, very first heading `#` of the content will be treated as title. |
| author <Badge type="danger">UNIMPLEMENTED</Badge> | String | Document author.                                                                            |
| theme                                             | String | Vivliostyle theme package or bare CSS file.                                                 |
| class <Badge type="danger">UNIMPLEMENTED</Badge>  | String | Custom classes applied to `<body>`                                                          |

**class**

```yaml
---
class: twocolumn
---

```

```css
body.twocolumn {
}
```

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
