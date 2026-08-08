# Vivliostyle Flavored Markdown

Vivliostyle Flavored Markdown (VFM) は本の執筆のために最適化された Markdown 記法です。Vivliostyle とその関連プロジェクトのために標準化され、公開されています。VFMは [CommonMark](https://commonmark.org/) および [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/) をベースにして実装されています。

## 目次

VFM の記法と機能を見出しカッコ内のアルファベット昇順（`A`〜`Z`）で並べています。

- [コード (Code)](#%E3%82%B3%E3%83%BC%E3%83%89-code)
  - [キャプションをつける (with caption)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B-with-caption)
- [脚注 (Footnotes)](#%E8%84%9A%E6%B3%A8-footnotes)
  - [脚注モード (Footnote mode)](#%E8%84%9A%E6%B3%A8%E3%83%A2%E3%83%BC%E3%83%89-footnote-mode)
- [フロントマター／前付け (Frontmatter)](#%E3%83%95%E3%83%AD%E3%83%B3%E3%83%88%E3%83%9E%E3%82%BF%E3%83%BC%EF%BC%8F%E5%89%8D%E4%BB%98%E3%81%91-frontmatter)
  - [定義済みのプロパティ (Defined properties)](#%E5%AE%9A%E7%BE%A9%E6%B8%88%E3%81%BF%E3%81%AE%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3-defined-properties)
  - [プロパティのオプション (Priority with options)](#%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3%E3%81%AE%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-priority-with-options)
  - [class プロパティの結合 (Merge class properties)](#class-%E3%83%97%E3%83%AD%E3%83%91%E3%83%86%E3%82%A3%E3%81%AE%E7%B5%90%E5%90%88-merge-class-properties)
- [強制改行（オプション） (Hard new line (optional))](#%E5%BC%B7%E5%88%B6%E6%94%B9%E8%A1%8C%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-hard-new-line-optional)
- [画像 (Image)](#%E7%94%BB%E5%83%8F-image)
  - [単一行キャプション (with caption and single line)](#%E5%8D%98%E4%B8%80%E8%A1%8C%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3-with-caption-and-single-line)
  - [キャプションなし画像のポリシー (Captionless image policy)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AA%E3%81%97%E7%94%BB%E5%83%8F%E3%81%AE%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC-captionless-image-policy)
  - [img と figcaption の順序 (Order of img and figcaption)](#img-%E3%81%A8-figcaption-%E3%81%AE%E9%A0%86%E5%BA%8F-order-of-img-and-figcaption)
  - [figcaption への ID 付与 (Assign ID to figcaption)](#figcaption-%E3%81%B8%E3%81%AE-id-%E4%BB%98%E4%B8%8E-assign-id-to-figcaption)
  - [キャプションのインライン Markdown 解析 (Parse figcaption as inline markdown)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AE%E3%82%A4%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3-markdown-%E8%A7%A3%E6%9E%90-parse-figcaption-as-inline-markdown)
- [リンク (Link)](#%E3%83%AA%E3%83%B3%E3%82%AF-link)
  - [相対リンク拡張子の書き換え (Rewrite relative href extensions)](#%E7%9B%B8%E5%AF%BE%E3%83%AA%E3%83%B3%E3%82%AF%E6%8B%A1%E5%BC%B5%E5%AD%90%E3%81%AE%E6%9B%B8%E3%81%8D%E6%8F%9B%E3%81%88-rewrite-relative-href-extensions)
- [数式 (Math equation)](#%E6%95%B0%E5%BC%8F-math-equation)
  - [数式レンダラー (Math renderer)](#%E6%95%B0%E5%BC%8F%E3%83%AC%E3%83%B3%E3%83%80%E3%83%A9%E3%83%BC-math-renderer)
- [そのままのHTML (Raw HTML)](#%E3%81%9D%E3%81%AE%E3%81%BE%E3%81%BE%E3%81%AEhtml-raw-html)
  - [Markdownをつける (with Markdown)](#markdown%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B-with-markdown)
- [ルビ (Ruby)](#%E3%83%AB%E3%83%93-ruby)
  - [ルビにおけるパイプのエスケープ (Escape pipe in ruby body)](#%E3%83%AB%E3%83%93%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E3%83%91%E3%82%A4%E3%83%97%E3%81%AE%E3%82%A8%E3%82%B9%E3%82%B1%E3%83%BC%E3%83%97-escape-pipe-in-ruby-body)
- [セクション分け (Sectionization)](#%E3%82%BB%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E5%88%86%E3%81%91-sectionization)
- [表 (Table)](#%E8%A1%A8-table)
  - [セル揃えの出力 (Cell alignment output)](#%E3%82%BB%E3%83%AB%E6%8F%83%E3%81%88%E3%81%AE%E5%87%BA%E5%8A%9B-cell-alignment-output)

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

### 脚注モード (Footnote mode)

脚注の出力方法を `footnote` オプションで選択します (`pandoc`、`dpub`、`gcpm`)。

- `stringify` / `VFM` API のオプション : `footnote: 'dpub'`
- CLI オプション : `--footnote dpub`
- フロントマター : `vfm:` プロパティへ `footnote: 'dpub'`

**VFM**

```markdown
VFM は GitHub リポジトリで開発しています[^1]。
脚注は行の中に記述することもできます^[この部分が脚注です。]。

[^1]: [VFM](https://github.com/vivliostyle/vfm)
```

**HTML** (`footnote: 'pandoc'`, default)

文書末尾の後注 (endnote) セクションへ脚注を集めます。前述の例を参照してください。

**HTML** (`footnote: 'dpub'`)

[DPUB-ARIA](https://www.w3.org/TR/dpub-aria-1.1/) に従い、参照を含むブロック要素の直後へ各脚注を `<aside role="doc-footnote">` 要素として配置します。

```html
<p>
  VFM は GitHub リポジトリで開発しています<a id="fnref1" href="#fn1" class="footnote-ref" role="doc-noteref"><sup>1</sup></a>。
  脚注は行の中に記述することもできます<a id="fnref2" href="#fn2" class="footnote-ref" role="doc-noteref"><sup>2</sup></a>。
</p>
<aside id="fn2" class="footnote" role="doc-footnote"><a href="#fnref2" class="footnote-back" role="doc-backlink"><sup>2</sup></a>この部分が脚注です。</aside>
<aside id="fn1" class="footnote" role="doc-footnote"><a href="#fnref1" class="footnote-back" role="doc-backlink"><sup>1</sup></a><a href="https://github.com/vivliostyle/vfm">VFM</a></aside>
```

**HTML** (`footnote: 'gcpm'`)

[CSS GCPM](https://www.w3.org/TR/css-gcpm-3/#footnotes) による脚注フロートのために、参照位置へ各脚注を `<span class="footnote">` としてインラインに埋め込みます。

```html
<p>
  VFM は GitHub リポジトリで開発しています<span class="footnote" id="fn-1" role="doc-footnote"><a href="https://github.com/vivliostyle/vfm">VFM</a></span>。
  脚注は行の中に記述することもできます<span class="footnote" id="fn-2" role="doc-footnote">この部分が脚注です。</span>。
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
| `mathRenderer`      | `String`  | `'mathjax'` | 数式レンダラー。指定可能な値は `'mathjax'` または `'mathml'`。[数式レンダラー (Math renderer)](#%E6%95%B0%E5%BC%8F%E3%83%AC%E3%83%B3%E3%83%80%E3%83%A9%E3%83%BC-math-renderer) を参照。 |
| `partial`           | `Boolean` | `false` | Markdown 部分だけを HTML 化する。`<body>` 以上は出力されない。 |
| `hardLineBreaks`    | `Boolean` | `false` | 空白を必要とせず強制改行の位置へ `<br>` を追加。 |
| `disableFormatHtml` | `Boolean` | `false` | HTML の自動整形を無効にする。 |
| `theme`             | `String`  | -       | Vivliostyle の theme パッケージか、CSS ファイルをそのまま指定する。 |
| `imgFigcaptionOrder` | `String` | `'img-figcaption'` | `figure` 内の `img` と `figcaption` の順序。指定可能な値は `'img-figcaption'` または `'figcaption-img'`。[img と figcaption の順序 (Order of img and figcaption)](#img-%E3%81%A8-figcaption-%E3%81%AE%E9%A0%86%E5%BA%8F-order-of-img-and-figcaption) を参照。 |
| `assignIdToFigcaption` | `Boolean` | `false` | ID を `img` / `code` ではなく `figcaption` へ付与する。[figcaption への ID 付与 (Assign ID to figcaption)](#figcaption-%E3%81%B8%E3%81%AE-id-%E4%BB%98%E4%B8%8E-assign-id-to-figcaption) を参照。 |
| `captionlessImagePolicy` | `String` | `'paragraph'` | `alt` が空の画像だけからなる段落の出力方法。指定可能な値は `'paragraph'`、`'figure'` または `'figure-with-figcaption'`。[キャプションなし画像のポリシー (Captionless image policy)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AA%E3%81%97%E7%94%BB%E5%83%8F%E3%81%AE%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC-captionless-image-policy) を参照。 |
| `parseFigcaptionAsInline` | `Boolean` | `false` | キャプションのテキストをインライン Markdown として再解析する。[キャプションのインライン Markdown 解析 (Parse figcaption as inline markdown)](#%E3%82%AD%E3%83%A3%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AE%E3%82%A4%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3-markdown-%E8%A7%A3%E6%9E%90-parse-figcaption-as-inline-markdown) を参照。 |
| `footnote`          | `String`  | `'pandoc'` | 脚注の出力モード。指定可能な値は `'pandoc'`、`'dpub'` または `'gcpm'`。[脚注モード (Footnote mode)](#%E8%84%9A%E6%B3%A8%E3%83%A2%E3%83%BC%E3%83%89-footnote-mode) を参照。 |
| `rewriteRelativeHrefExtensions` | `Boolean` または `String[]` | `false` | 相対リンクの拡張子を `.html` へ書き換える。[相対リンク拡張子の書き換え (Rewrite relative href extensions)](#%E7%9B%B8%E5%AF%BE%E3%83%AA%E3%83%B3%E3%82%AF%E6%8B%A1%E5%BC%B5%E5%AD%90%E3%81%AE%E6%9B%B8%E3%81%8D%E6%8F%9B%E3%81%88-rewrite-relative-href-extensions) を参照。 |
| `table`             | `Object`  | -       | 表の出力設定。例: `cell: 'align-class'`。[セル揃えの出力 (Cell alignment output)](#%E3%82%BB%E3%83%AB%E6%8F%83%E3%81%88%E3%81%AE%E5%87%BA%E5%8A%9B-cell-alignment-output) を参照。 |

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

`<figcaption>` は画像の `alt` と内容が重複するため、標準では `aria-hidden` になります。`{alt=...}` 属性で明示された `alt` がキャプションと異なる場合は、両方が支援技術へ公開されます。

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

### キャプションなし画像のポリシー (Captionless image policy)

キャプション (`alt`) のない画像だけで構成された段落の出力方法を `captionlessImagePolicy` オプションで制御します (`paragraph`、`figure`、`figure-with-figcaption`)。

- `stringify` / `VFM` API のオプション : `captionlessImagePolicy: 'figure'`
- CLI オプション : `--captionless-image-policy figure`
- フロントマター : `vfm:` プロパティへ `captionlessImagePolicy: 'figure'`

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

空の `<figcaption>` はアクセシビリティ ツリーのノイズを避けるため `aria-hidden` のままになります。この値を指定すると、キャプションの有無に関わらず CSS カウンターや `imgFigcaptionOrder` / `assignIdToFigcaption` を一律に適用できます。

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

### img と figcaption の順序 (Order of img and figcaption)

`<figure>` 内の `<img>` と `<figcaption>` の順序を `imgFigcaptionOrder` オプションで制御します (`img-figcaption` または `figcaption-img`、初期値は `img-figcaption`)。

- `stringify` / `VFM` API のオプション : `imgFigcaptionOrder: 'figcaption-img'`
- CLI オプション : `--img-figcaption-order figcaption-img`
- フロントマター : `vfm:` プロパティへ `imgFigcaptionOrder: 'figcaption-img'`

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

### figcaption への ID 付与 (Assign ID to figcaption)

`assignIdToFigcaption: true` を指定すると、画像に書かれた `id` 属性が `<img>` ではなく `<figcaption>` へ付与されます。

- `stringify` / `VFM` API のオプション : `assignIdToFigcaption: true`
- CLI オプション : `--assign-id-to-figcaption`
- フロントマター : `vfm:` プロパティへ `assignIdToFigcaption: true`

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

### キャプションのインライン Markdown 解析 (Parse figcaption as inline markdown)

`parseFigcaptionAsInline: true` を指定すると、キャプションのテキストをインライン Markdown (強調、ルビ、数式、脚注など) として再解析します。画像の `alt` は描画済みキャプションのプレーン テキストから導出されます。

- `stringify` / `VFM` API のオプション : `parseFigcaptionAsInline: true`
- CLI オプション : `--parse-figcaption-as-inline`
- フロントマター : `vfm:` プロパティへ `parseFigcaptionAsInline: true`

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

## リンク (Link)

標準の Markdown リンクです。

### 相対リンク拡張子の書き換え (Rewrite relative href extensions)

相対リンクの `href` 末尾の拡張子を `.html` へ書き換えます。Markdown ファイルごとに HTML へ変換する、複数ファイル構成の本で有用です。`true` は `['md']` の短縮形で、配列 (例: `['md', 'adoc']`) を渡すと対象の拡張子を広げられます。

- `stringify` / `VFM` API のオプション : `rewriteRelativeHrefExtensions: true`
- CLI オプション : `--rewrite-relative-href-extensions md` (繰り返し指定可)
- フロントマター : `vfm:` プロパティへ `rewriteRelativeHrefExtensions: true`

書き換えの対象は、参照が相対 (スキームなし、ホストなし、パスが `/` で始まらない) である `<a>` と `<area>` 要素だけです。クエリー文字列とフラグメントは維持されます。書き換えは純粋に構文的なもので、ファイル システムは参照しません。対象の `*.html` を実際に生成するのは利用側の責任です。

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

### 数式レンダラー (Math renderer)

`math` が有効なときに使用するレンダラーを `mathRenderer` オプションで選択します (`mathjax` または `mathml`、初期値は `mathjax`)。

- `stringify` / `VFM` API のオプション : `mathRenderer: 'mathml'`
- CLI オプション : `--math-renderer mathml`
- フロントマター : `vfm:` プロパティへ `mathRenderer: 'mathml'`

`'mathjax'` は前述の例のように LaTeX ソースを維持し、実行時レンダリングのために MathJax を読み込む `<script>` を出力します。`'mathml'` は [Temml](https://temml.org/) によりビルド時に LaTeX を MathML へ変換します。実行時のスクリプトは出力されません。

`'mathml'` では、開始と終了の `$$` がそれぞれ単独行になっている数式はディスプレイ モード `<math display="block">` として描画されます。

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
  <section class="level1">
    <h1 id="heading">Heading</h1>
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

- 見出しの行が `#` ではじまり同数以上の `#` で終わる場合はセクションを分けません
  - `### Not Sectionize ###` （同じ数の `#` で囲まれている） -- セクション分けしない
  - `### Sectionize ##` （閉じの `#` の数が足りない） -- セクション分けする
- `#` だけからなる行により `#` の数と一致する深さのセクションを終了させることができる
  - 例: `### Heading 3` で開始したセクションは `###` で終了させられる
- 親が `blockquote` の場合はセクションを分けません
- 見出しの深さへ一致するように、セクションの `levelN` クラスを設定します

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

## 表 (Table)

[GFM の表](https://github.github.com/gfm/#tables-extension-) をサポートします。

### セル揃えの出力 (Cell alignment output)

区切り行に書かれた列の揃えは、標準では HTML4 の `align` 属性として出力されます。各セル (`th` / `td`) が揃えをどう表現するかを `table.cell` オプションで選択します (`align-attribute`、`align-class` または `align-style`、初期値は `align-attribute`)。

- `stringify` / `VFM` API のオプション : `table: { cell: 'align-class' }`
- CLI オプション : `--table-cell align-class`
- フロントマター : `vfm:` プロパティの `table:` へ `cell: 'align-class'`

`'align-class'` は代わりに `table-align-{left|center|right}` クラスを出力します。これは HTML5 / EPUB 3.3 に適合します。VFM は対応する CSS を同梱しないため、スタイル設定はテーマの責任です。`'align-style'` は代わりにインラインの `style="text-align: ..."` を出力します。これは HTML5 / EPUB 3.3 に適合し、CSS なしで揃えが描画されます。

Node.js API では `table.cell` へ関数 (`TableCellHook`) を指定して各セルを自由にカスタマイズすることもできます。TypeScript の型情報を参照してください。

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
