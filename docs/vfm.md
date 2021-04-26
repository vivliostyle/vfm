# Vivliostyle Flavored Markdown: Working Draft

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects. VFM is implemented top on CommonMark and GFM.

## Table of contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Code](#code)
  - [with caption](#with-caption)
- [Image](#image)
  - [with caption and single line](#with-caption-and-single-line)
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
- [Hard new line (optional)](#hard-new-line)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

### with caption and single line

<Badge type="warning">PRE-RELEASE</Badge>

Wraps an image written as a single line and with a caption in `<figure>`.

If specify attributes for the image, the `id` is moved to `<figure>` and everything else is copied except for` <img> `specific (such as `src`).

**VFM**

```md
![Figure 1](./fig1.png)

![Figure 2](./fig2.png "Figure 2"){id="image" data-sample="sample"}

text ![Figure 3](./fig3.png)
```

**HTML**

```html
<figure>
  <img src="./fig1.png" alt="Figure 1" />
  <figcaption>Figure 1</figcaption>
</figure>
<figure id="image" title="Figure 2" data-sample="sample">
  <img src="./fig2.png" alt="caption" title="Figure 2" data-sample="sample">
  <figcaption>Figure 2</figcaption>
</figure>
<p>text <img src="./fig3.png" alt="Figure 3"></p>
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

Outputs HTML processed by [MathJax](https://www.mathjax.org/).

It is disabled by default. It is activated by satisfying one of the following.

- VFM options: `math: true`
- CLI options: `--math`
- Frontmatter: `math: true` (Priority over others)

The VFM syntax for MathJax inline is `$...$` and the display is `$$...$$`.

It also supports multiple lines, such as `$x = y\n1 + 1 = 2$` and `$$\nx = y\n$$`. However, if there is a blank line `\n\n` such as `$x = y\n\n1 + 1 = 2$ `, the paragraphs will be separated and it will not be a mathematical syntax.

OK:

- `$...$`, `$$...$$` ...Range specification matches
- `$...\n...$`, `$$\n...\n$$` ...Within the same paragraph
- `$...\$...$`, `$...\$...\\\$..$`,  `$$...\$...\\\$...$$` ...Escape `$` by odd `\`

NG:

- `$...$$`, `$$...$` ...Range specification does not match
- `$...\n\n...$`, `$$...\n\n...$$` ...Split paragraph
- `$ ...$` ...Spaces (space, tab, new line, ...etc) ` ` immediately after `$` at start of inline
- `$... $` ...Spaces (space, tab, new line, ...etc) ` ` immediately before `$` at end of inline
- `$...$5` ...Digit `0...N` immediately after `$` at end of inline

**VFM**

```markdown
inline:$x = y$

display: $$1 + 1 = 2$$
```

**HTML**

It also outputs the `<script>` and `<body>` attributes for processing MathJax in Vivliostyle if `math` is enabled.

```html
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML"></script>
  </head>
  <body data-math-typeset="true">
    <p>inline: <span class="math inline">\(x = y\)</span></p>
    <p>display: <span class="math display">$$1 + 1 = 2$$</span></p>
  </body>
</html>
```

**CSS**

```css
.math.inline {
}

.math.display {
}
```

## Frontmatter

Frontmatter is a way of defining metadata in Markdown (file) units.

```yaml
---
title: 'Introduction to VFM'
author: 'Author'
class: 'my-class'
math: true
---

```

#### Reserved words

| Property | Type    | Description                                                                                 |
| -------- | ------- | ------------------------------------------------------------------------------------------- |
| title    | String  | Document title. If missing, very first heading `#` of the content will be treated as title. |
| author   | String  | Document author.                                                                            |
| class    | String  | Custom classes applied to `<body>`                                                          |
| math     | Boolean | Enable math syntax.                                                                         |
| theme    | String  | Vivliostyle theme package or bare CSS file.                                                 |

The priority of `title` is as follows.

1. `title` property of the frontmatter
2. First heading `#` of the content
3. `title` option of VFM

The priority of `math` is as follows.

1. `math` property of the frontmatter
2. `math` option of VFM

**class**

```yaml
---
class: 'twocolumn'
---

```

```css
body.twocolumn {
}
```

To specify multiple classes, define as `class:'foo bar'`.

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

## Hard new line

- A newline puts `<br/>` to the end of a line.
- Consecutive 2 newlines creates a new sentence block.

This feature is optional. The Node.js API is enabled by specifying `hardLineBreaks: true` as an option and the CLI by specifying `--hard-line-breaks`.

**VFM**

```md
はじめまして。

Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。
VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle プロジェクトのために策定・実装されました。
```

**HTML**

```html
<!-- hardLineBreaks: true -->
<p>はじめまして。</p>
<p>
  Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。<br />
  VFM は出版物の執筆に適した Markdown 方言であり、Vivliostyle
  プロジェクトのために策定・実装されました。
</p>

<!-- hardLineBreaks: false (Default) -->
<p>はじめまして。</p>
<p>
  Vivliostyle Flavored Markdown（略して VFM）の世界へようこそ。 VFM
  は出版物の執筆に適した Markdown 方言であり、Vivliostyle
  プロジェクトのために策定・実装されました。
</p>
```

**CSS**

```css
p {
}
```
