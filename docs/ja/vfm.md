# Vivliostyle Flavored Markdown

Vivliostyle Flavored Markdown (VFM) は本の執筆のために最適化された Markdown 記法です。Vivliostyle とその関連プロジェクトのために標準化され、公開されています。VFMは [CommonMark](https://commonmark.org/) および [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/) をベースにして実装されています。

## 目次

VFM の記法と機能を見出しカッコ内のアルファベット昇順（`A`〜`Z`）で並べています。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [コード (Code)](#%E3%82%B3%E3%83%BC%E3%83%89-code)
  - [キャプションをつける (with caption)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B-with-caption)
- [脚注 (Footnotes)](#%E8%84%9A%E6%B3%A8-footnotes)
- [フロントマター／前付け (Frontmatter)](#%E3%83%95%E3%83%AD%E3%83%B3%E3%83%88%E3%83%9E%E3%82%BF%E3%83%BC%EF%BC%8F%E5%89%8D%E4%BB%98%E3%81%91-frontmatter)
  - [定義済みのプロパティ (Defined properties)](#%E5%AE%9A%E7%BE%A9%E6%B8%88%E3%81%BF%E3%81%AE%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3-defined-properties)
  - [プロパティのオプション (Priority with options)](#%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3%E3%81%AE%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-priority-with-options)
  - [class プロパティの結合 (Merge class properties)](#class-%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3%E3%81%AE%E7%B5%90%E5%90%88-merge-class-properties)
- [強制改行（オプション） (Hard new line (optional))](#%E5%BC%B7%E5%88%B6%E6%94%B9%E8%A1%8C%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-hard-new-line-optional)
- [画像 (Image)](#%E7%94%BB%E5%83%8F-image)
  - [単一行キャプション (with caption and single line)](#%E5%8D%98%E4%B8%80%E8%A1%8C%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-with-caption-and-single-line)
- [数式 (Math equation)](#%E6%95%B0%E5%BC%8F-math-equation)
- [そのままのHTML (Raw HTML)](#%E3%81%9D%E3%81%AE%E3%81%BE%E3%81%BE%E3%81%AEhtml-raw-html)
  - [Markdownをつける (with Markdown)](#markdown%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B-with-markdown)
- [ルビ (Ruby)](#%E3%83%AB%E3%83%93-ruby)
  - [ルビにおけるパイプのエスケープ (Escape pipe in ruby body)](#%E3%83%AB%E3%83%93%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E3%83%91%E3%82%A4%E3%83%97%E3%81%AE%E3%82%A8%E3%82%B9%E3%82%B1%E3%83%BC%E3%83%97-escape-pipe-in-ruby-body)
- [セクション分け (Sectionization)](#%E3%82%BB%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E5%88%86%E3%81%91-sectionization)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## コード (Code)

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

VFM は構文強調に [Prism](https://prismjs.com/) を利用しています。

### キャプションをつける (with caption)

**VFM**

````md
```javascript:app.js
function main() {}
```
````

あるいは

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

## 脚注 (Footnotes)

脚注の定義は [Pandoc](https://pandoc.org/MANUAL.html#footnotes) のようになります。

**VFM**

```markdown
VFM は GitHub リポジトリで開発しています[^1].
イシューは GitHub で管理します[^イシュー].
脚注は行の中に記述することもできます^[この部分が脚注です。].

[^1]: [VFM](https://github.com/vivliostyle/vfm)

[^イシュー]: [イシュー](https://github.com/vivliostyle/vfm/issues)
```

**HTML**

```html
    <p>
      VFM は GitHub リポジトリで開発しています<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>.
      イシューは GitHub で管理します<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>.
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

フロントマター／前付けは Markdown ファイル単位でメタデータを定義するための方法です。ファイルの冒頭へ YAML で記述します。

YAML の解析には [js-yaml](https://www.npmjs.com/package/js-yaml) を使用しています。スキーマは [JSON_SCHEMA](https://yaml.org/spec/1.2/spec.html#id2803231) です。

js-yaml の解析は `key:` を `key: null` にします。しかし VFM はこれを空の文字列として扱います。属性値のプロパティとして `key:` または `key:""` が指定された場合は `key=""` を出力します。

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

テキスト
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

### 定義済みのプロパティ (Defined properties)

| プロパティ | データ型 | 説明 |
| -------: | :--------: | --- |
| `id`     | `String`   | `<html id="...">` |
| `lang`   | `String`   | `<html lang="...">` |
| `dir`    | `String`   | `<html dir="...">`、指定可能な値は `ltr`、`rtl` または `auto`。 |
| `class`  | `String`   | `<html class="...">` と `<body class="...">` へ反映される。|
| `title`  | `String`   | `<title>...</title>` がない場合、コンテンツの最初の見出しがタイトルになる。 |
| `html`   | `Object`   | `<html key="value">`、キーと値のペアが `<html>` の属性になる。 |
| `body`   | `Object`   | `<body key="value">`、キーと値のペアが `<body>` の属性になる。 |
| `base`   | `Object`   | `<base key="value">`、キーと値のペアが `<base>` の属性になる。 |
| `meta`   | `Object[]` |  `<meta key="value">`、キーと値のペアが `<meta>` の属性となる。 |
| `link`   | `Object[]` | `<meta key="value">`、キーと値のペアが `<link>` の属性となる。 |
| `script` | `Object[]` | `<script key="value">`、キーと値のペアが `<script>` の属性となる。 |
| `vfm`    | `Object`   | VFM の設定。 |
| `head`   | -          | 将来の利用に予約済み。 |
| `style`  | -          | 将来の利用に予約済み。 |
| その他 |`String`|`<meta name="key" content="value">`、キーと値のペアは単独の `<meta>` になる。 |

**vfm**

| プロパティ| データ型| 初期値 | 説明 |
| ------------------: | :-------: | :-----: | --- |
| `math`              | `Boolean` | `true`  | 数式を有効にする。 |
| `partial`           | `Boolean` | `false` | Markdown 部分だけを HTML 化する。`<body>` 以上は出力されない。 |
| `hardLineBreaks`    | `Boolean` | `false` | 空白を必要とせず強制改行の位置へ `<br>` を追加。 |
| `disableFormatHtml` | `Boolean` | `false` | HTML の自動整形を無効にする。 |
| `theme`             | `String`  | -       | Vivliostyle の theme パッケージか、CSS ファイルをそのまま指定する。 |

### プロパティのオプション (Priority with options)

同じ目的の仕様が複数ある場合、優先順位は以下の通りになります。

1. フロントマター／前付け
2. VFM オプション

フロントマター／前付けにおいて `html` プロパティでルートの `id` と重複した `id` が指定されている場合、ルートで定義された方が優先されます。

```yaml
---
id: 'sample1'
html:
  id: 'sample2'
---
```

この例では `sample1` が採用されました。

```html
<html id="sample1">
</html>
```

### class プロパティの結合 (Merge class properties)

最上層と `html`、`body` の `class` プロパティはスペース区切りで結合されます。

```yaml
---
class: 'root'
html:
  class: 'html'
body:
  class: 'body sample'
---
```

以下は結合された例です。

```html
<html class="root html">
  <body class="root body sample">
  </body>
</html>
```

## 強制改行（オプション） (Hard new line (optional))

- 改行すると行末へ `<br/>` が付きます
- 2 行連続の改行は新しいブロックを生成します

この機能はオプションです。Node.js API はオプションとして `hardLineBreaks: true`、CLI では `--hard-line-breaks` を指定することで有効化されます。

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

## 画像 (Image)

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

### 単一行キャプション (with caption and single line)

単一行で書かれた画像はキャプション付きで `<figure>` 内へ包み込みます。

画像の属性を指定した場合、`id` は `<figure>` へ移動され ` <img>` 固有のもの (`src` など) を除いたすべてがコピーされます。

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

## 数式 (Math equation)

[MathJax](https://www.mathjax.org/) により処理したHTMLを出力します。

数式は標準で有効化されています。無効にする場合は以下を指定してください。

- `stringify` API のオプション : `math: false`
- `VFM` API のオプション : `math: false`
- CLI オプション : `--disable-math`
- フロントマター : `vfm:` プロパティへ `math: false`
  - 参照 : [フロントマター／前付け (Frontmatter)](#frontmatter)
  - これは `stringify` よりも優先されますが `VFM` ではそうなりません

VFM における MathJax のインライン記法は `$...$`、ディスプレイ記法は `$$...$$` となります。

また `$x = y\n1 + 1 = 2$` や `$$\nx = y\n$$` のような複数行もサポートします。ただし `$x = y\n\n1 + 1 = 2$ ` のように空行 `\n\n` がある場合は段落として分かれるため数式にはなりません。

OK:

- `$...$`, `$$...$$` ...範囲指定が一致
- `$...\n...$`, `$$\n...\n$$` ...同じ段落内
- `$...\$...$`, `$...\$...\\\$..$`,  `$$...\$...\\\$...$$` ...奇数個の `\` により `$` をエスケープ（無効化）する

NG:

- `$...$$`, `$$...$` ...範囲指定が不一致
- `$...\n\n...$`, `$$...\n\n...$$` ...改行によって段落へ分離されてしまう
- `$ ...$` ...スペース (スペース、タブ文字、改行など)、インライン開始の `$` 直後に ` ` がある
- `$... $` ...スペース (スペース、タブ文字、改行など)、インライン終了の `$` 直前に ` ` がある
- `$...$5` ...インライン終了の `$` 直後に数字 `0...N` がある


**VFM**

```markdown
inline:$x = y$

display: $$1 + 1 = 2$$
```

**HTML**

`math` が有効で数式記法か `<math>` タグが存在する場合は MathJax 処理用の `<script>` も出力します。

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

## そのままのHTML (Raw HTML)

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

### Markdownをつける (with Markdown)

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

### ルビにおけるパイプのエスケープ (Escape pipe in ruby body)

区切り記号となるパイプ `|` をエスケープ (無効化) したい場合は直前に `\` を追加します。

**VFM**

```
{a\|b|c}
```

**HTML**

```html
<p><ruby>a|b<rt>c</rt></ruby></p>
```

## セクション分け (Sectionization)

見出しを階層的なセクションにします。

- 親が `blockquote` の場合はセクションを分けません
- 見出しの深さへ一致するように、セクションの `levelN` クラスを設定します
- 見出しの深さへ一致するように、セクションの `aria-labelledby` 属性を設定します

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
<section id="plain" class="level1" aria-labelledby="heading-1">
  <h1>Plain</h1>
</section>

<section id="intro" class="level1" aria-labelledby="heading-1">
  <h1>Introduction</h1>
</section>

<section class="level1" aria-labelledby="heading-1">
  <h1 id="welcome" class="title">Welcome</h1>
</section>

<section class="level1" aria-labelledby="heading-1">
  <h1 id="level-1">Level 1</h1>
  <section class="level2" aria-labelledby="heading-2">
    <h2 id="level-2">Level 2</h2>
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

.level1 {
}
.level2 {
}

blockquote > h1 {
}
```
