# Vivliostyle Flavored Markdown

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects. VFM is implemented top on [CommonMark](https://commonmark.org/) and [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/).

## Table of contents

VFM syntax and features are listed in ascending alphabetical (`A`-`Z`) order.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Code](#code)
  - [with caption](#with-caption)
- [Footnotes](#footnotes)
  - [Footnote mode](#footnote-mode)
- [Frontmatter](#frontmatter)
  - [Defined properties](#defined-properties)
  - [Priority with options](#priority-with-options)
  - [Merge class properties](#merge-class-properties)
- [Hard new line](#hard-new-line)
- [Image](#image)
  - [with caption and single line](#with-caption-and-single-line)
  - [Captionless image policy](#captionless-image-policy)
  - [Order of img and figcaption](#order-of-img-and-figcaption)
  - [Assign ID to figcaption](#assign-id-to-figcaption)
  - [Parse figcaption as inline markdown](#parse-figcaption-as-inline-markdown)
- [Link](#link)
  - [Rewrite relative href extensions](#rewrite-relative-href-extensions)
- [Math equation](#math-equation)
  - [Math renderer](#math-renderer)
- [Raw HTML](#raw-html)
  - [with Markdown](#with-markdown)
- [Ruby](#ruby)
  - [Escape pipe in ruby body](#escape-pipe-in-ruby-body)
- [Sectionization](#sectionization)
- [Table](#table)
  - [Cell alignment output](#cell-alignment-output)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Code

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

## Footnotes

Define a footnotes, like [Pandoc](https://pandoc.org/MANUAL.html#footnotes).

**VFM**

```markdown
VFM is developed in the GitHub repository[^1].
Issues are managed on GitHub[^Issues].
Footnotes can also be written inline^[This part is a footnote.].

[^1]: [VFM](https://github.com/vivliostyle/vfm)

[^Issues]: [Issues](https://github.com/vivliostyle/vfm/issues)
```

**HTML**

```html
<p>
  VFM is developed in the GitHub repository <a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.
  Issues are managed on GitHub <a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.
  Footnotes can also be written inline <a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a>.
</p>
<section class="footnotes" role="doc-endnotes">
  <hr>
  <ol>
    <li id="fn1" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
    <li id="fn2" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm/issues">Issues</a><a href="#fnref2" class="footnote-back" role="doc-backlink">↩</a></li>
    <li id="fn3" role="doc-endnote">This part is a footnote.<a href="#fnref3" class="footnote-back" role="doc-backlink">↩</a></li>
  </ol>
</section>
```

**CSS**

```css
.footnotes {
}
```

### Footnote mode

Selects how footnotes are output with the `footnote` option (`pandoc`, `dpub` or `gcpm`).

- `stringify` / `VFM` API options: `footnote: 'dpub'`
- CLI options: `--footnote dpub`
- Frontmatter: `footnote: 'dpub'` of `vfm:` property

**VFM**

```markdown
VFM is developed in the GitHub repository[^1].
Footnotes can also be written inline^[This part is a footnote.].

[^1]: [VFM](https://github.com/vivliostyle/vfm)
```

**HTML** (`footnote: 'pandoc'`, default)

Collects the notes into an endnote section at the end of the document. Refer to the previous example.

**HTML** (`footnote: 'dpub'`)

Places each note as an `<aside role="doc-footnote">` element after the block element containing its call, following [DPUB-ARIA](https://www.w3.org/TR/dpub-aria-1.1/).

```html
<p>
  VFM is developed in the GitHub repository<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.
  Footnotes can also be written inline<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.
</p>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>This part is a footnote.</aside>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a><a href="https://github.com/vivliostyle/vfm">VFM</a></aside>
```

**HTML** (`footnote: 'gcpm'`)

Embeds each note inline at the call site as `<span class="footnote">`, for footnote floating by [CSS GCPM](https://www.w3.org/TR/css-gcpm-3/#footnotes).

```html
<p>
  VFM is developed in the GitHub repository<span class="footnote" id="fn-1" role="doc-footnote"><a href="https://github.com/vivliostyle/vfm">VFM</a></span>.
  Footnotes can also be written inline<span class="footnote" id="fn-2" role="doc-footnote">This part is a footnote.</span>.
</p>
```

**CSS**

```css
/* dpub */
aside.footnote {
}

/* gcpm */
span.footnote {
  float: footnote;
}
```

## Frontmatter

Frontmatter is a way of defining metadata in Markdown (file) units. Write YAML at the beginning of the file.

I'm using [js-yaml](https://www.npmjs.com/package/js-yaml) for parse in YAML. Schema is [JSON_SCHEMA](https://yaml.org/spec/1.2/spec.html#id2803231). 

The js-yaml parse makes `key:` to `key: null`. However, VFM treats this as an empty string. If `key:` or `key:""` is specified as the property of the attribute value, it is output as `key=""`. 

**VFM**

```yaml
---
id: 'my-page'
lang: 'ja'
dir: 'ltr'
class: 'my-class'
title: 'Title'
html:
  data-color-mode: 'dark'
  data-light-theme: 'light'
  data-dark-theme: 'dark'
body:
  id: 'body'
  class: 'foo bar'
base:
  target: '_top'
  href: 'https://www.example.com/'
meta:
  - name: 'theme-color'
    media: '(prefers-color-scheme: light)'
    content: 'red'
  - name: 'theme-color'
    media: '(prefers-color-scheme: dark)'
    content: 'darkred'
link:
  - rel: 'stylesheet'
    href: 'sample1.css'
  - rel: 'stylesheet'
    href: 'sample2.css'
script:
  - type: 'text/javascript'
    src: 'sample1.js'
  - type: 'text/javascript'
    src: 'sample2.js'
vfm:
  math: false
  theme: 'theme.css'
  partial: false
  hardLineBreaks: false
  disableFormatHtml: false
author: 'Author'
---

Text
```

**HTML**

```html
<!doctype html>
<html data-color-mode="dark" data-light-theme="light" data-dark-theme="dark" id="my-page" lang="ja" dir="ltr" class="my-class">
  <head>
    <meta charset="utf-8">
    <title>Title</title>
    <base target="_top" href="https://www.example.com/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="red">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="darkred">
    <meta name="author" content="Author">
    <link rel="stylesheet" href="sample1.css">
    <link rel="stylesheet" href="sample2.css">
    <script type="text/javascript" src="sample1.js"></script>
    <script type="text/javascript" src="sample2.js"></script>
  </head>
  <body id="body" class="my-class foo bar">
    <p>Text</p>
  </body>
</html>
```

**CSS**

```css
.my-class {
}

.foo.bar {
}
```

### Defined properties

| Property | Type       | Description |
| -------: | :--------: | --- |
| `id`     | `String`   | `<html id="...">` |
| `lang`   | `String`   | `<html lang="...">` |
| `dir`    | `String`   | `<html dir="...">`, value is `ltr`, `rtl` or `auto`. |
| `class`  | `String`   | `<html class="...">` and `<body class="...">` |
| `title`  | `String`   | `<title>...</title>`, if missing, very first heading of the content will be treated as title. |
| `html`   | `Object`   | `<html key="value">`, key/value pair becomes attribute of `<html>`. |
| `body`   | `Object`   | `<body key="value">`, key/value pair becomes attribute of `<body>`. |
| `base`   | `Object`   | `<base key="value">`, key/value pair becomes attribute of `<base>`. |
| `meta`   | `Object[]` | `<meta key="value">`, key/value pair becomes attribute of `<meta>`. |
| `link`   | `Object[]` | `<link key="value">`, key/value pair becomes attribute of `<link>`. |
| `script` | `Object[]` | `<script key="value">`, key/value pair becomes attribute of `<script>`. |
| `vfm`    | `Object`   | VFM settings. |
| `head`   | -          | Reserved for future use. |
| `style`  | -          | Reserved for future use. |
| Other    |`String`|`<meta name="key" content="value">`, key/value pair becomes one `<meta>`. |

**vfm**

| Property            | Type      | Default | Description |
| ------------------: | :-------: | :-----: | --- |
| `math`              | `Boolean` | `true`  | Enable math syntax. |
| `mathRenderer`      | `String`  | `'mathjax'` | Math renderer, value is `'mathjax'` or `'mathml'`. Refer to [Math renderer](#math-renderer). |
| `partial`           | `Boolean` | `false` | Output markdown fragments. |
| `hardLineBreaks`    | `Boolean` | `false` | Add `<br>` at the position of hard line breaks, without needing spaces. |
| `disableFormatHtml` | `Boolean` | `false` | Disable automatic HTML format. |
| `theme`             | `String`  | -       | Vivliostyle theme package or bare CSS file. |
| `imgFigcaptionOrder` | `String` | `'img-figcaption'` | Order of `img` and `figcaption` elements in `figure`, value is `'img-figcaption'` or `'figcaption-img'`. Refer to [Order of img and figcaption](#order-of-img-and-figcaption). |
| `assignIdToFigcaption` | `Boolean` | `false` | Assign ID to `figcaption` instead of `img` / `code`. Refer to [Assign ID to figcaption](#assign-id-to-figcaption). |
| `captionlessImagePolicy` | `String` | `'paragraph'` | How to render an image-only paragraph whose `alt` is empty, value is `'paragraph'`, `'figure'` or `'figure-with-figcaption'`. Refer to [Captionless image policy](#captionless-image-policy). |
| `parseFigcaptionAsInline` | `Boolean` | `false` | Re-parse figcaption text as inline markdown. Refer to [Parse figcaption as inline markdown](#parse-figcaption-as-inline-markdown). |
| `footnote`          | `String`  | `'pandoc'` | Footnote output mode, value is `'pandoc'`, `'dpub'` or `'gcpm'`. Refer to [Footnote mode](#footnote-mode). |
| `rewriteRelativeHrefExtensions` | `Boolean` or `String[]` | `false` | Rewrite the extension of relative document links to `.html`. Refer to [Rewrite relative href extensions](#rewrite-relative-href-extensions). |
| `table`             | `Object`  | -       | Table output settings, e.g. `cell: 'align-class'`. Refer to [Cell alignment output](#cell-alignment-output). |

### Priority with options

If there are multiple specifications for the same purpose, the priority is as follows.

1. Frontmatter
2. VFM options

In Frontmatter, if there is a duplicate of the root `id` and `id` in the `html` property, the root definition takes precedence.

```yaml
---
id: 'sample1'
html:
  id: 'sample2'
---
```

In this example, `sample1` is adopted.

```html
<html id="sample1">
</html>
```

### Merge class properties

The `class` properties of the root, `html`, and `body` are combined separated by spaces.

```yaml
---
class: 'root'
html:
  class: 'html'
body:
  class: 'body sample'
---
```

In this example, merged.

```html
<html class="root html">
  <body class="root body sample">
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

## Image

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

Wraps an image written as a single line and with a caption in `<figure>`.

**VFM**

```md
![Figure 1](./fig1.png)

![Figure 2](./fig2.png "Figure 2"){id="image" data-sample="sample"}

text ![Figure 3](./fig3.png)
```

**HTML**

```html
<figure>
  <img src="./fig1.png" alt="Figure 1">
  <figcaption aria-hidden="true">Figure 1</figcaption>
</figure>
<figure>
  <img src="./fig2.png" alt="Figure 2" title="Figure 2" id="image" data-sample="sample">
  <figcaption aria-hidden="true">Figure 2</figcaption>
</figure>
<p>text 
  <img src="./fig3.png" alt="Figure 3">
</p>
```

**CSS**

```css
figure img {
}
figure figcaption {
}
```

The `<figcaption>` is `aria-hidden` by default because it duplicates the image `alt`. When an explicit `{alt=...}` attribute differs from the caption, both are exposed to assistive technology.

**VFM**

```md
![Figure 3](./fig3.png){alt="Photo of fig 3"}
```

**HTML**

```html
<figure>
  <img src="./fig3.png" alt="Photo of fig 3">
  <figcaption>Figure 3</figcaption>
</figure>
```

### Captionless image policy

Controls how an image-only paragraph without a caption (empty `alt`) is rendered, with the `captionlessImagePolicy` option (`paragraph`, `figure` or `figure-with-figcaption`).

- `stringify` / `VFM` API options: `captionlessImagePolicy: 'figure'`
- CLI options: `--captionless-image-policy figure`
- Frontmatter: `captionlessImagePolicy: 'figure'` of `vfm:` property

**VFM**

```md
![](./divider.svg)
```

**HTML** (`captionlessImagePolicy: 'paragraph'`, default)

```html
<p>
  <img src="./divider.svg">
</p>
```

**HTML** (`captionlessImagePolicy: 'figure'`)

```html
<figure>
  <img src="./divider.svg">
</figure>
```

**HTML** (`captionlessImagePolicy: 'figure-with-figcaption'`)

The empty `<figcaption>` stays `aria-hidden` to avoid accessibility-tree noise. This value lets CSS counters and `imgFigcaptionOrder` / `assignIdToFigcaption` apply uniformly across captioned and captionless cases.

```html
<figure>
  <img src="./divider.svg">
  <figcaption aria-hidden="true"></figcaption>
</figure>
```

**CSS**

```css
figure img {
}
figure figcaption {
}
```

### Order of img and figcaption

Controls the order of `<img>` and `<figcaption>` in `<figure>` with the `imgFigcaptionOrder` option (`img-figcaption` or `figcaption-img`, the default is `img-figcaption`).

- `stringify` / `VFM` API options: `imgFigcaptionOrder: 'figcaption-img'`
- CLI options: `--img-figcaption-order figcaption-img`
- Frontmatter: `imgFigcaptionOrder: 'figcaption-img'` of `vfm:` property

**VFM**

```md
![Figure 1](./fig1.png)
```

**HTML** (`imgFigcaptionOrder: 'figcaption-img'`)

```html
<figure>
  <figcaption aria-hidden="true">Figure 1</figcaption>
  <img src="./fig1.png" alt="Figure 1">
</figure>
```

### Assign ID to figcaption

If `assignIdToFigcaption: true` is specified, the `id` attribute written with the image is assigned to `<figcaption>` instead of `<img>`.

- `stringify` / `VFM` API options: `assignIdToFigcaption: true`
- CLI options: `--assign-id-to-figcaption`
- Frontmatter: `assignIdToFigcaption: true` of `vfm:` property

**VFM**

```md
![Figure 2](./fig2.png){id="image"}
```

**HTML** (`assignIdToFigcaption: true`)

```html
<figure>
  <img src="./fig2.png" alt="Figure 2">
  <figcaption aria-hidden="true" id="image">Figure 2</figcaption>
</figure>
```

### Parse figcaption as inline markdown

If `parseFigcaptionAsInline: true` is specified, the caption text is re-parsed as inline markdown (emphasis, ruby, math, footnotes, ...etc). The image `alt` is derived from the plain text of the rendered caption.

- `stringify` / `VFM` API options: `parseFigcaptionAsInline: true`
- CLI options: `--parse-figcaption-as-inline`
- Frontmatter: `parseFigcaptionAsInline: true` of `vfm:` property

**VFM**

```md
![**Figure** {V|ビ} $x$](./fig1.png)
```

**HTML** (`parseFigcaptionAsInline: true`)

```html
<figure>
  <img src="./fig1.png" alt="Figure Vビ \(x\)">
  <figcaption aria-hidden="true"><strong>Figure</strong> <ruby>V<rt>ビ</rt></ruby> <span class="math inline" data-math-typeset="true">\(x\)</span></figcaption>
</figure>
```

**HTML** (`parseFigcaptionAsInline: false`, default)

```html
<figure>
  <img src="./fig1.png" alt="**Figure** {V|ビ} $x$">
  <figcaption aria-hidden="true">**Figure** {V|ビ} $x$</figcaption>
</figure>
```

## Link

Standard Markdown links.

### Rewrite relative href extensions

Rewrites the trailing extension of relative hyperlink `href`s to `.html`, with the `rewriteRelativeHrefExtensions` option. Useful for multi-file books where each Markdown file is converted to HTML. `true` is shorthand for `['md']`; pass an array (e.g. `['md', 'adoc']`) to broaden the set of source extensions.

- `stringify` / `VFM` API options: `rewriteRelativeHrefExtensions: true`
- CLI options: `--rewrite-relative-href-extensions md` (repeatable)
- Frontmatter: `rewriteRelativeHrefExtensions: true` of `vfm:` property

Only `<a>` and `<area>` elements whose reference is relative (no scheme, no host, and the path does not start with `/`) are rewritten. Query strings and fragments are preserved. The rewrite is purely syntactic: the file system is not consulted, so producing the target `*.html` is the embedder's responsibility.

**VFM**

```md
[Chapter 2](./chapter2.md#intro)

[Remote](https://example.com/page.md)
```

**HTML** (`rewriteRelativeHrefExtensions: true`)

```html
<p><a href="./chapter2.html#intro">Chapter 2</a></p>
<p><a href="https://example.com/page.md">Remote</a></p>
```

## Math equation

Outputs HTML processed by [MathJax](https://www.mathjax.org/).

It is Enabled by default. To disable it, specify the following.

- `stringify` API options: `math: false`
- `VFM` API options: `math: false`
- CLI options: `--disable-math`
- Frontmatter: `math: false` of `vfm:` property
  - refs: [Frontmatter](#frontmatter)
  - It takes precedence over `stringify`, but` VFM` does not.

The VFM syntax for MathJax inline is `$...$` and the display is `$$...$$`.

It also supports multiple lines, such as `$x = y\n1 + 1 = 2$` and `$$\nx = y\n$$`. However, if there is a blank line `\n\n` such as `$x = y\n\n1 + 1 = 2$ `, the paragraphs will be separated and it will not be a mathematical syntax.

OK:

- `$...$`, `$$...$$` ...Range specification matches
- `$...\n...$`, `$$\n...\n$$` ...Within the same paragraph
- `$...\$...$`, `$...\$...\\\$..$`,  `$$...\$...\\\$...$$` ...Escape `$` by odd `\`

NG:

- `$...$$`, `$$...$` ...Range specification does not match
- `$...\n\n...$`, `$$...\n\n...$$` ...Separated into paragraphs by line breaks
- `$ ...$` ...Spaces (space, tab, new line, ...etc), ` ` immediately after `$` at start of inline
- `$... $` ...Spaces (space, tab, new line, ...etc), ` ` immediately before `$` at end of inline
- `$...$5` ...Digit `0...N` immediately after `$` at end of inline

**VFM**

```markdown
inline:$x = y$

display: $$1 + 1 = 2$$
```

**HTML**

It also outputs `<script>` for processing MathJax if `math` is enabled and the math syntax or the `<math>` tag is actually existed.

```html
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML"></script>
  </head>
  <body>
    <p>inline: <span class="math inline" data-math-typeset="true>"\(x = y\)</span></p>
    <p>display: <span class="math display" data-math-typeset="true">$$1 + 1 = 2$$</span></p>
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

### Math renderer

Selects the renderer used when `math` is enabled, with the `mathRenderer` option (`mathjax` or `mathml`, the default is `mathjax`).

- `stringify` / `VFM` API options: `mathRenderer: 'mathml'`
- CLI options: `--math-renderer mathml`
- Frontmatter: `mathRenderer: 'mathml'` of `vfm:` property

`'mathjax'` keeps the LaTeX source and outputs a `<script>` to load MathJax for runtime rendering, as in the previous example. `'mathml'` converts LaTeX to MathML at build time via [Temml](https://temml.org/); no runtime script is output.

With `'mathml'`, a `$$` equation whose fences stand on their own lines is rendered in display mode as `<math display="block">`.

**VFM**

```markdown
inline: $x = y$

$$
1 + 1 = 2
$$
```

**HTML** (`mathRenderer: 'mathml'`)

```html
<p>inline: 
  <math>
    <mrow>
      <mi>x</mi>
      <mo>=</mo>
      <mi>y</mi>
    </mrow>
  </math>
</p>
<math display="block" class="tml-display" style="display:block math;">
  <mrow>
    <mn>1</mn>
    <mo>+</mo>
    <mn>1</mn>
    <mo>=</mo>
    <mn>2</mn>
  </mrow>
</math>
```

**CSS**

```css
math {
}
math[display='block'] {
}
```

## Raw HTML

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
  <section class="level1">
    <h1 id="heading">Heading</h1>
  </section>
</div>
```

## Ruby

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

### Escape pipe in ruby body

If want to escape the delimiter pipe `|`, add `\` immediately before it.

**VFM**

```
{a\|b|c}
```

**HTML**

```html
<p><ruby>a|b<rt>c</rt></ruby></p>
```

## Sectionization

Make the heading a hierarchical section.

- Do not sectionize if the heading line starts with `#`s and ends with equal or greater number of `#`s.
  - `### Not Sectionize ###` (enclosed by equal number of `#`s) -- not sectionize
  - `### Sectionize ##` (insufficient number of closing `#`s) -- sectionize 
- A line with only `#`s can be used to end the section whose depth matches the number of the `#`s.
  - e.g., the section starting with `### Heading 3` can end with `###`.
- Do not sectionize if parent is `blockquote`.
- Set the `levelN` class in the section to match the heading depth.

**VFM**

```md
# Plain

# Introduction {#intro}

# Welcome {.title}

# Level 1

## Level 2

### Level 3

##

Level 2 was ended by `##`.

## Not Sectionize {.just-a-heading} ##

> # Not Sectionize in Blockquote
```

**HTML**

```html
<section class="level1">
  <h1 id="plain">Plain</h1>
</section>
<section class="level1">
  <h1 id="intro">Introduction</h1>
</section>
<section class="level1">
  <h1 class="title" id="welcome">Welcome</h1>
</section>
<section class="level1">
  <h1 id="level-1">Level 1</h1>
  <section class="level2">
    <h2 id="level-2">Level 2</h2>
    <section class="level3">
      <h3 id="level-3">Level 3</h3>
    </section>
  </section>
  <p>Level 2 was ended by <code>##</code>.</p>
  <h2 class="just-a-heading" id="not-sectionize">Not Sectionize</h2>
  <blockquote>
    <h1 id="not-sectionize-in-blockquote">Not Sectionize in Blockquote</h1>
  </blockquote>
</section>
```

**CSS**

```css
body > section {
}

section:has(> #intro) {
}

section:has(> h1.title) {
}

.level1 {
}
.level2 {
}

blockquote > h1 {
}
```

## Table

[GFM tables](https://github.github.com/gfm/#tables-extension-) are supported.

### Cell alignment output

Column alignment written in the delimiter row is output as the HTML4 `align` attribute by default. The `table.cell` option selects how each cell (`th` / `td`) expresses the alignment (`align-attribute`, `align-class` or `align-style`, the default is `align-attribute`).

- `stringify` / `VFM` API options: `table: { cell: 'align-class' }`
- CLI options: `--table-cell align-class`
- Frontmatter: `cell: 'align-class'` of `table:` in `vfm:` property

`'align-class'` outputs a `table-align-{left|center|right}` class instead, which conforms to HTML5 / EPUB 3.3. VFM ships no CSS for it; styling is the theme's responsibility. `'align-style'` outputs an inline `style="text-align: ..."` instead, which conforms to HTML5 / EPUB 3.3 and renders aligned without accompanying CSS.

In the Node.js API, `table.cell` also accepts a function (`TableCellHook`) that customizes each cell freely. Refer to the TypeScript type information.

**VFM**

```md
| Left | Center | Right | None |
|:-----|:------:|------:|------|
| a    | b      | c     | d    |
```

**HTML** (`table.cell: 'align-attribute'`, default)

```html
<table>
  <thead>
    <tr>
      <th align="left">Left</th>
      <th align="center">Center</th>
      <th align="right">Right</th>
      <th>None</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="left">a</td>
      <td align="center">b</td>
      <td align="right">c</td>
      <td>d</td>
    </tr>
  </tbody>
</table>
```

**HTML** (`table.cell: 'align-class'`)

```html
<table>
  <thead>
    <tr>
      <th class="table-align-left">Left</th>
      <th class="table-align-center">Center</th>
      <th class="table-align-right">Right</th>
      <th>None</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="table-align-left">a</td>
      <td class="table-align-center">b</td>
      <td class="table-align-right">c</td>
      <td>d</td>
    </tr>
  </tbody>
</table>
```

**HTML** (`table.cell: 'align-style'`)

```html
<table>
  <thead>
    <tr>
      <th style="text-align: left">Left</th>
      <th style="text-align: center">Center</th>
      <th style="text-align: right">Right</th>
      <th>None</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: left">a</td>
      <td style="text-align: center">b</td>
      <td style="text-align: right">c</td>
      <td>d</td>
    </tr>
  </tbody>
</table>
```

**CSS**

```css
.table-align-left {
  text-align: left;
}
.table-align-center {
  text-align: center;
}
.table-align-right {
  text-align: right;
}
```
