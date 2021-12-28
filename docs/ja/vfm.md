# Vivliostyle Flavored Markdown

Vivliostyle Flavored Markdown (VFM) は、本の執筆のために最適化されたMarkdown記法です。Vivliostyleとその関連プロジェクトのために標準化され、公開されています。VFMは、[CommonMark](https://commonmark.org/) および [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/) をベースにして実装されています。

## 目次

VFMの記法とその機能は、見出しカッコ内のアルファベット昇順（`A`〜`Z`）で表示されます。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [コード \(Code\)](#%E3%82%B3%E3%83%BC%E3%83%89-code)
  - [キャプションをつける \(with caption\)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B-with-caption)
- [脚注 \(Footnotes\)](#%E8%84%9A%E6%B3%A8-footnotes)
- [フロントマター／前付け \(Frontmatter\)](#%E3%83%95%E3%83%AD%E3%83%B3%E3%83%88%E3%83%9E%E3%82%BF%E3%83%BC%EF%BC%8F%E5%89%8D%E4%BB%98%E3%81%91-frontmatter)
  - [実装保留中のプロパティ \(Reserved properties\)](#%E5%AE%9F%E8%A3%85%E4%BF%9D%E7%95%99%E4%B8%AD%E3%81%AE%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3-reserved-properties)
  - [プロパティのオプション \(Priority with options\)](#%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3%E3%81%AE%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-priority-with-options)
  - [classプロパティでの統合 \(Merge class properties\)](#class%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3%E3%81%A7%E3%81%AE%E7%B5%B1%E5%90%88-merge-class-properties)
- [強制改行（オプション） \(Hard new line \(optional\)\)](#%E5%BC%B7%E5%88%B6%E6%94%B9%E8%A1%8C%EF%BC%88%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%EF%BC%89-hard-new-line-optional)
- [画像 \(Image\)](#%E7%94%BB%E5%83%8F-image)
  - [単行のキャプションをつける(with caption and single line)](#%E5%8D%98%E8%A1%8C%E3%81%AE%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%92%E3%81%A4%E3%81%91%E3%82%8Bwith-caption-and-single-line)
- [数式 \(Math equation\)](#%E6%95%B0%E5%BC%8F-math-equation)
- [そのままのHTML \(Raw HTML\)](#%E3%81%9D%E3%81%AE%E3%81%BE%E3%81%BE%E3%81%AEhtml-raw-html)
  - [Markdownをつける\(with Markdown\)](#markdown%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B-with-markdown)
- [ルビ \(Ruby\)](#%E3%83%AB%E3%83%93-ruby)
  - [ルビにおけるパイプのエスケープ \(Escape pipe in ruby body\)](#%E3%83%AB%E3%83%93%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E3%83%91%E3%82%A4%E3%83%97%E3%81%AE%E3%82%A8%E3%82%B9%E3%82%B1%E3%83%BC%E3%83%97-escape-pipe-in-ruby-body)
- [セクション分け \(Sectionization\)](#%E3%82%BB%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E5%88%86%E3%81%91-sectionization)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## コード \(Code\)

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

VFMはシンタックス・ハイライトに[Prism](https://prismjs.com/)を利用しています。

### キャプションをつける \(with caption\)

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

## 脚注 \(Footnotes\)

[Pandoc](https://pandoc.org/MANUAL.html#footnotes)に似た脚注を定義します。

**VFM**

```markdown
VFMはGitHubリポジトリで開発しています[^1].
イシューはGitHubで管理します[^イシュー].
脚注は行の中に記述することもできます^[この部分が脚注です。].

[^1]: [VFM](https://github.com/vivliostyle/vfm)

[^イシュー]: [イシュー](https://github.com/vivliostyle/vfm/issues)
```

**HTML**

```html
    <p>
      VFMはGitHubリポジトリで開発しています<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.
      イシューはGitHubで管理します<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.
      脚注は行の中に記述することもできます<a id="fnref3" href="#fn3" class="footnote-ref" role="doc-noteref"><sup>3</sup></a>.
    </p>
    <section class="footnotes" role="doc-endnotes">
      <hr>
      <ol>
        <li id="fn1" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm">VFM</a><a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></li>
        <li id="fn2" role="doc-endnote"><a href="https://github.com/vivliostyle/vfm/issues">イシュー</a><a href="#fnref2" class="footnote-back" role="doc-backlink">↩</a></li>
        <li id="fn3" role="doc-endnote">この部分が脚注です。<a href="#fnref3" class="footnote-back" role="doc-backlink">↩</a></li>
      </ol>
    </section>
```

**CSS**

```css
.footnotes {
}
```

## フロントマター／前付け (Frontmatter)

フロントマター／前付けは、Markdown（ファイル）単位でメタデータを定義する方法です。ファイルの冒頭にYAMLを記述します。

YAMLのパースには[js-yaml](https://www.npmjs.com/package/js-yaml)を使用しています。スキーマは[JSON_SCHEMA](https://yaml.org/spec/1.2/spec.html#id2803231)です。

js-yaml のパースでは `key:` は `key: null` にします。しかし、VFMはこれを空の文字列として扱います。属性値のプロパティとして `key:` または `key:""` が指定された場合、 `key=""` と出力されます。

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
    <p>テキスト</p>
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

### 実装保留中のプロパティ \(Reserved properties\)

| プロパティ | データ型 | 説明 |
| -------: | :--------: | --- |
| `id`     | `String`   | `<html id="...">` |
| `lang`   | `String`   | `<html lang="...">` |
| `dir`    | `String`   | `<html dir="...">`, 値は `ltr`、`rtl` あるいは `auto` |
| `class`  | `String`   | `<html class="...">` と `<body class="...">` |
| `title`  | `String`   | `<title>...</title>`がない場合、コンテンツの最初の見出しがタイトルになる |
| `html`   | `Object`   | `<html key="value">`とすると、キーと値のペアは `<html>` の属性になる |
| `body`   | `Object`   | `<body key="value">`とすると、キーと値のペアは `<body>` の属性になる|
| `base`   | `Object`   | `<base key="value">`とすると、キーと値のペアは `<base>` の属性になる|
| `meta`   | `Object[]` |  `<meta key="value">` とすると、キーと値のペアは `<meta>` の属性となる|
| `link`   | `Object[]` | `<meta key="value">` とすると、キーと値のペアは `<link>` の属性となる。|
| `script` | `Object[]` | `<script key="value">` とすると、キーと値のペアは `<script>` の属性となる|
| `vfm`    | `Object`   | VFMの設定|
| `head`   | -          | 将来使用するための予約|
| `style`  | -          | 将来使用するための予約|
| その他 |`String`|`<meta name="key" content="value">` とすると、キーと値のペアは単独の `<meta>` になる。|

**vfm**

| プロパティ| データ型| 初期値 | 説明 |
| ------------------: | :-------: | :-----: | --- |
| `math`              | `Boolean` | `true`  | 数式の記法を有効にする |
| `partial`           | `Boolean` | `false` | マークダウンによるfragmentを出力 |
| `hardLineBreaks`    | `Boolean` | `false` | 空白を必要としない、強制改行の位置に `<br>` を追加|
| `disableFormatHtml` | `Boolean` | `false` |HTMLの自動整形を無効にする |
| `theme`             | `String`  | -       | Vivliostyleのthemeパッケージか、そのままのCSSファイル |

### プロパティのオプション \(Priority with options\)

同じ目的の仕様が複数ある場合、優先順位は以下の通りになります。

1. フロントマター／前付け
2. VFMオプション

フロントマター／前付けにおいては、`html`プロパティでルートの `id` と重複して`id` が指定されている場合、ルートで定義された方が優先されます。



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

### classプロパティでの統合 \(Merge class properties\)

ルート、`html`、`body`の `class` プロパティは、スペースで区切って統合されます。

```yaml
---
class: 'root'
html:
  class: 'html'
body:
  class: 'body sample'
---
```

以下の例では統合されています。

```html
<html class="root html">
  <body class="root body sample">
  </body>
</html>
```

## 強制改行（オプション） \(Hard new line \(optional\)\)

- 改行すると、行末に `<br/>` が付きます
- 2行連続の改行で新しい文ブロックを作成します.

この機能はオプションです。Node.js APIではオプションとして `hardLineBreaks: true` を、CLIでは `--hard-line-breaks` を指定することで有効になります。

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

## 画像 \(Image\)

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

### 単行のキャプションをつける\(with caption and single line\)

1行で書かれ、また`<figure>`によりキャプションが付けられた画像を包含します。

画像の属性を指定すると、 `id`は` <figure> `に移動され、` <img> `固有のもの（`src`など）を除いて他のすべてがコピーされます。

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

## 数式 \(Math equation\)

[MathJax](https://www.mathjax.org/)により処理したHTMLを出力します。

デフォルトでは有効になっています。無効にする場合は、以下を指定してください。

- `stringify` APIオプション: `math: false`
- `VFM` APIオプション: `math: false`
- CLIオプション: `--disable-math`
- フロントマター: `vfm:`プロパティの`math: false`
  - 参照: [フロントマター／前付け (Frontmatter)](#frontmatter)
  - これは `stringify` よりも優先されますが、`VFM` では異なります。

MathJaxにおけるインラインのVFM記法は`$...$`であり、表示は`$$...$$`となります。

また、`$x = yÌn1 + 1 = 2$` や `$$nx = yÌn$` のような複数行もサポートします。ただし、`$x = yn´kn1 + 1 = 2$ `のように空行 `nn` があると段落に分かれてしまい、数式の記法になりません。

OK:

- `$...$`、`$$...$$` ……範囲指定が一致
- `$...\n...$`、`$$\n...\n$$` ……同じ段落内
- `$...\$...$`、`$...\$...\\\$..$`、`$$...\$...\\\$...$$`……奇数の `\`で `$`をエスケープ（無効化）する

NG:

- `$...$$`、`$$...$` ……範囲指定が不一致
- `$...\n\n...$`、`$$...\n\n...$$` ……段落に分離
- `$ ...$``$ ...$` ……スペース（スペース、タブ、改行など）` `インライン開始時の `$`の直後
- `$…… $` ……スペース（スペース、タブ、改行など） ` `インラインの最後の `$`の直前
- `$...$5` ……インラインの最後の `$`の直後に `0 ... N`を数字で示す

**VFM**

```markdown
inline:$x = y$

display: $$1 + 1 = 2$$
```

**HTML**

また、`math`が有効であり数式記法や`<math>`タグが存在する場合、MathJax処理用の`<script>`も出力します。

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

## そのままのHTML \(Raw HTML\)

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

### Markdownをつける \(with Markdown\)

**VFM**

```markdown
<div class="custom">

# Heading

</div>
```

**HTML**

```html
<div class="custom">
  <section id="heading" class="level1">
    <h1>Heading</h1>
  </section>
</div>
```

## ルビ (Ruby)

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

### ルビにおけるパイプのエスケープ \(Escape pipe in ruby body\)

区切り符号パイプ `|` をエスケープ（無効化）したい場合、直前に `\` を追加してください。

**VFM**

```
{a\|b|c}
```

**HTML**

```html
<p><ruby>a|b<rt>c</rt></ruby></p>
```

## セクション分け \(Sectionization\)

見出しを階層的なセクションにします。

- 親が `blockquote` の場合、セクション分けはしません
- 見出しの属性は基本的にセクションにコピーされます
- `id` 属性はセクションに移動します
- `hidden` 属性はコピーされず、見出しだけが適用されます
- 見出しの深さに一致するように、セクションの `levelN` クラスを設定します

**VFM**

```md
# Plain

# Introduction {#intro}

# Welcome {.title}

# Level 1

## Level 2

> # Not Sectionize
```

**HTML**

```html
<section id="plain" class="level1">
  <h1>Plain</h1>
</section>

<section id="intro" class="level1">
  <h1>Introduction</h1>
</section>

<section class="level1 title" id="welcome">
  <h1 class="title">Welcome</h1>
</section>

<section id="level-1" class="level1">
  <h1>Level 1</h1>
  <section id="level-2" class="level2">
    <h2>Level 2</h2>
  </section>
</section>

<blockquote>
  <h1 id="not-sectionize">Not Sectionize</h1>
</blockquote>
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

.level1 {
}
.level2 {
}

blockquote > h1 {
}
```
