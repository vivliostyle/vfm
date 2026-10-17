# remark 13 移行: `packages/vfm` インベントリ

remark 13 移行に向けた `packages/vfm` のモジュール単位のインベントリ (Phase 0-1, [#277](https://github.com/vivliostyle/vfm/issues/277))。[remark13-migration.md](./remark13-migration.md) の要約を展開したもので、Phase 2 / 3 / 4 の Issue でチェックリストとして使うことを想定している。2026-10-17 時点の `main` を対象に調査した。

以下で使うパイプラインの段階:

- **mdast**: Markdown AST 上で動く unified プラグイン (`mdastPlugins` slot)。
- **handler**: `remark-rehype` に渡す `mdast-util-to-hast` の handler (`mdastToHastHandlers` slot)。
- **hast**: HTML AST 上で動く unified プラグイン (`hastPlugins` slot)。
- **wrapper / schema**: 自身ではツリーに触れない。外部プラグインをラップするか、オプション スキーマを定義するだけ。

変更分類:

- **Rewrite**: 仕組みそのものが remark 13 に存在しない (旧 tokenizer、unified の名前空間型、remark-parse のオプション)。
- **Adapt**: 同じ仕組みが別の API で存在する (handler 署名、型名変更、hast ユーティリティの major 更新)。
- **Keep**: remark のバージョンに依存しない。共通の型パッケージの更新のみ。

## プロセッサ構成

### メイン プロセッサ (`src/index.ts`, `VFM()`)

```
remark-parse { gfm, commonmark }
  → mdastPlugins (11 slot, revive-parse.ts)
  → inspect('mdast')
  → remark-rehype { allowDangerousHtml, handlers }
  → hastPlugins (8 slot, revive-rehype.ts)
  → inspect('hast')
  → rehype-stringify
```

| # | mdast slot (`revive-parse.ts`) | 出所 | 備考 |
| --- | --- | --- | --- |
| 1 | `parseImageAltAsInline` | figure.ts | `Image.alt` を `this.parse()` で再パース |
| 2 | `lineBreaks` | line-breaks.ts | `hardLineBreaks` 時に remark-breaks |
| 3 | `math` | math.ts | 旧 tokenizer。`findAndReplace` のフォールバックあり |
| 4 | `ruby` | @vivliostyle/remark-ruby | 旧 tokenizer |
| 5 | `footnote` | footnotes.ts | remark-footnotes `{ inlineNotes: true }` |
| 6 | `attr` | attr.ts | remark-attr |
| 7 | `slug` | slug.ts | `data.hProperties.id` を設定 |
| 8 | `section` | @vivliostyle/remark-sectionize | |
| 9 | `code` | code.ts | remark-attr が書いた属性を読む |
| 10 | `toc` | toc.ts | remark-shortcodes + フィルター |
| 11 | `frontmatter` | remark-frontmatter | |

| handler slot (`revive-rehype.ts`) | 出所 | 備考 |
| --- | --- | --- |
| `displayMath` | math.ts | |
| `inlineMath` | math.ts | |
| `ruby` | @vivliostyle/remark-ruby | |
| `code` | code.ts | |
| `paragraph` | revive-rehype.ts | 合成: `buildDisplayMath` ?? `buildFigure` ?? 既定の `<p>` |
| `table` | mdast-to-hast-table-cell | deep import した既定の `table` handler をラップ |
| `footnoteDefinition` / `footnoteReference` / `footnote` | footnote パッケージ | `undefined` のエントリーは除外して既定 handler に委ねる |

| # | hast slot (`revive-rehype.ts`) | 出所 | 備考 |
| --- | --- | --- | --- |
| 1 | `raw` | rehype-raw | |
| 2 | `deriveImgAltFromFigcaption` | figure.ts | `raw` の後である必要がある |
| 3 | `footnoteTransformer` | footnote パッケージ | |
| 4 | `replace` | replace.ts | |
| 5 | `rewriteRelativeHrefExtensions` | @vivliostyle/rehype-rewrite-extension | |
| 6 | `document` | document.ts | ツリーを `<html>` で包む。`partial` 時はスキップ |
| 7 | `math` | math.ts | `document` の後である必要がある (`<head>` に書く) |
| 8 | `format` | format.ts | `disableFormatHtml` でなければ rehype-format |

`VFM()` のその他の特徴:

- `.data('settings', { position: true })` を remark-parse 8 に渡している。remark-parse 11 には `position` 設定が無く、position は常に付く。
- `editPlugins` フックは 3 つのリストを受け取り、任意の pluggable リストを返せる。ブランド slot 型 (`brand<T>()`) は名目的なもので、SemVer の契約ではないと明記されている。
- `undefined` の handler エントリーは `remark-rehype` に渡す前に除外し、既定 handler を上書きしないようにしている。

### 2 本目のプロセッサ (`src/plugins/metadata.ts`, `readMetadata()`)

```
remark-parse { gfm, commonmark } → footnotes → attr → frontmatter → mdast (metadata reader)
  → remark-rehype → rehype-stringify
```

- frontmatter YAML、最初の見出し、`[[toc]]` から `vfile.data` を埋めるためだけに存在する。HTML 出力は捨てる。
- `.data('settings', { position: false })` は remark 13 では効果が無い。
- プラグイン リストを `unified.PluggableList<unified.Settings>` にキャストしている。unified 11 ではこの名前空間型が消える。
- `unist-util-select` による見出し検索を hast の `Element` として型付けしているが、ツリーは mdast。実行時には無害だが、`@types/mdast` 4 でキャストを直す必要がある。

## モジュール インベントリ

### `src/plugins/`

| ファイル | 段階 | export | remark 8 依存 | 変更 |
| --- | --- | --- | --- | --- |
| `attr.ts` | wrapper | `mdast` | remark-attr 0.11 が `Parser.prototype` の tokenizer を書き換える。更新停止。 | **Rewrite**。micromark / mdast 拡張として自作する ([#46](https://github.com/vivliostyle/vfm/issues/46), [#211](https://github.com/vivliostyle/vfm/issues/211))。先行試作は `origin/remark-attribute`。 |
| `code.ts` | mdast + handler | `mdast`, `handler`, `CodeOptionsSchema`, `CodeOptions` | `code` ノードを `visit`。`meta` が空のとき remark-attr が書く `hProperties` を削除する ("bad hack" 対策)。`refractor.highlight()` は v3 では配列を返す。handler は `(h, node)` で `h(node.position, tag, props, children)` を呼ぶ。`unist` の `Data` に `hName` / `hProperties` / `hChildren` / `figcaptionTitle` を augmentation。 | **Adapt**。attr の書き直しに合わせて remark-attr 対策を削る。refractor 5 は `Root` を返すので `.children` を取る。handler は `(state, node)` にし、`state.patch` / `state.applyData` で要素を組む。augmentation は `figcaptionTitle` だけ残す (他は `mdast-util-to-hast` 13 が提供)。 |
| `document.ts` | hast | `mdast` (歴史的な名前。実際は hast 上で動く), `DocumentSerializableOptionsSchema`, `DocumentOptions` | `doctype` ノードと hastscript 7 で組んだ `<html>` を持つ新しい root を返す。`h('head', ...children)` と children を可変長引数で渡している。`vfile.stem` とグローバル型 `KeyValue` を使う。 | **Adapt**。hastscript 9 は最初の非文字列引数を properties と解釈するので、children は 1 つの配列で渡す。slot API を見直す際に export 名を変えるか `hast` の別名を付ける。 |
| `figure.ts` | mdast + handler ヘルパー + hast | `mdast` (`parseImageAltAsInline`), `buildFigure`, `hast` (`deriveImgAltFromFigcaption`), `FigureOptionsSchema`, `FigcaptionInlineOptionsSchema`, オプション型 | `this.parse(image.alt)` は remark-parse 8 が `alt` に生の Markdown ソースを保持することに依存する。micromark は `alt` をプレーンテキストに decode するため、プラグインが動く前にキャプション内のインライン記法が失われる。`buildFigure` は `H` を受け取り `mdast-util-to-hast` 11 の `one(h, ...)` / `all(h, ...)` を呼ぶ。`Image` ノードに非標準の `children` を付ける。`parseHtml` は `hast-util-raw` 6 (`raw(tree)`) を使う。 | alt の再パースは **Rewrite**: `alt` を再パースするのではなく、micromark / from-markdown 層で生のキャプション ソースを捕捉する (例: 拡張がソース テキストを `data` に記録する)。`buildFigure` は `state.one()` / `state.all()` に、`hast-util-raw` 9 (`raw(tree, options)`) に **Adapt**。`Image.children` の慣習は `@types/mdast` 4 の下で型付きノードまたは `data` フィールドにする。 |
| `footnotes.ts` | wrapper | `mdast`, `createFootnotePlugin`, `FootnoteModeSchema`, `FootnoteOptionsSchema`, `YamlFootnoteOptionsSchema`, factory 型の再 export | remark-footnotes 2 (旧 tokenizer、deprecated) を `inlineNotes: true` で使う。handler が `(h, node)` の footnote 3 パッケージへ振り分ける。モジュール コメントが `mdast-util-to-hast` 10 / 11 の二重依存を記述している。 | パーサー側は **Rewrite**: remark-gfm 4 は `footnoteDefinition` / `footnoteReference` を提供するが inline note `^[...]` は無いので、inline note 拡張が必要 (再作成しなければ `footnote` ノード型は消える)。handler の振り分けは footnote パッケージと一緒に v13 署名へ **Adapt**。`mdast-util-to-hast` 13 が生成する endnote 構造 (`<section data-footnotes>`、`user-content-` 接頭辞、`clobberPrefix`) は v10 と異なり、pandoc パッケージを左右する。 |
| `format.ts` | wrapper | `hast`, `FormatOptionsSchema`, `FormatOptions` | rehype-format 3。ambient な `declare module` で型付け。 | **Adapt**: rehype-format 5 は型を同梱する。ambient 宣言を削除。 |
| `line-breaks.ts` | wrapper | `mdast`, `LineBreaksOptionsSchema`, `LineBreaksOptions` | remark-breaks 1 は `Parser.prototype` を書き換える。ambient な `declare module` で型付け。 | **Adapt**: remark-breaks 4 は型付きの通常の mdast transformer。 |
| `math.ts` | mdast (tokenizer) + handler + hast | `mdast`, `handlerInlineMath`, `handlerDisplayMath`, `buildDisplayMath`, `hast`, `MathRendererSchema`, `MathOptionsSchema`, オプション型 | `types/remark.d.ts` のグローバル型 `Tokenizer` を使って `inlineMath` / `displayMath` を `Parser.prototype.inlineTokenizers` / `inlineMethods` に追加する。「remark 13 以降」向けの `findAndReplace` フォールバックがあるが、パース後に動くため `$...$` 内の `**x**` はすでに `strong` になっており等価ではない。handler は `(h, node)` で `node.data.value` を読む。`StaticPhrasingContentMap` を augmentation。 | パーサー側は micromark 拡張として **Rewrite** (候補は remark-math 6、[#224](https://github.com/vivliostyle/vfm/issues/224)。`inlineMath` / `math` ノードを `data.value` ではなく `value` で出す)。`findAndReplace` フォールバックは削除。handler は `(state, node)` と `PhrasingContentMap` に **Adapt**。hast 段 (MathJax `<script>` 注入、temml 出力) は影響なし。 |
| `metadata.ts` | mdast (独自プロセッサ) | `readMetadata`, `VFMSettingsSchema`, `VFMSettings`, `Metadata`, `Attribute` | 上記「2 本目のプロセッサ」を参照。加えて `visit(tree, 'shortcode')` は remark-shortcodes のノード型に依存。`readTitleFromHeading` は `footnote` 子要素 (inline note) を除外し、その時点ではルビがパースされていないため正規表現でルビ記法を取り除く。 | プロセッサ構築を **Adapt** (`import { unified }`、remark-gfm、parse オプション無し、`PluggableList` キャスト無し)。除外するノード型は `toc` と inline footnote の決定に従う。 |
| `options.ts` | schema | `SerializablePluginOptionsSchema`, `SerializablePluginOptions` | なし。 | **Keep**。 |
| `replace.ts` | hast | `replace`, `ReplaceRuleSchema`, `ReplaceOptionsSchema`, `ReplaceRule`, `ReplaceOptions` | `hast-util-find-and-replace` 3 の default import、ambient な `declare module` で型付け。ユーザー コールバックに hastscript の `h` を渡すので `typeof h` が公開 API。 | **Adapt**: v5 は `findAndReplace` を名前付き export し、同じ `[find, replace]` のリスト形式を受け付ける。hastscript 9 でユーザー コールバックが見る `h` の型が変わる。`ReplaceRule` 固定に関する `@todo` を見直す。 |
| `rewrite-relative-href-extensions.ts` | schema + resolver | `RewriteRelativeHrefExtensionsOptionsSchema`, `resolveRewriteRelativeHrefExtensions`, オプション型 | なし。hast 処理は `@vivliostyle/rehype-rewrite-extension` にある。 | **Keep**。 |
| `slug.ts` | mdast | `mdast` | `unist-util-select` 4 と `mdast-util-to-string` 3。`footnote` 子要素 (inline note) を除外。`heading.data.id` と `heading.data.hProperties.id` を書く。 | ユーティリティの major 更新に **Adapt**。`footnotes.ts` で選ぶ inline footnote ノード型と同期する。 |
| `table.ts` | schema + hook adapter | `resolveTableCellHook`, `TableOptionsSchema`, `YamlTableOptionsSchema`, `TableCell*` スキーマと型 | 直接の依存なし。`@vivliostyle/mdast-to-hast-table-cell` と `@vivliostyle/vfm-internal-utils` に依存。 | **Keep**。型は `@types/hast` 3 に従う。 |
| `toc.ts` | wrapper + mdast | `mdast`, `Shortcode` | remark-shortcodes 0.3 が `Parser.prototype.blockTokenizers` を書き換える (旧 tokenizer、更新停止、ambient な `declare module` で型付け)。`keepToC` が `[[toc]]` 以外の shortcode を除去する。`BlockContentMap` を augmentation。 | [#207](https://github.com/vivliostyle/vfm/issues/207) に従って **Rewrite** または廃止。残す場合は `[[toc]]` 用の micromark 拡張 (または directive ベースの構文) が必要。`metadata.ts` が同じノード型に依存する。 |

### `src/`

| ファイル | 役割 | remark 8 依存 | 変更 |
| --- | --- | --- | --- |
| `index.ts` | `VFM()` と `stringify()` の構築。スキーマ、型、ブランド型の再 export | `import unified, { type Processor } from 'unified'`。`[remarkParse, { gfm: true, commonmark: true }]`。`EditedPlugins` が `unified.Pluggable` を使う。`settings.position`。 | import を **Rewrite** (`import { unified } from 'unified'`、`Pluggable` / `Processor` を名前付き型で)。parse オプションを mdast slot リストの remark-gfm に置き換える。`editPlugins` がブランド slot を公開し続けるか決める。 |
| `revive-parse.ts` | mdast 11 slot とブランド型の組み立て | `unified.Pluggable` 名前空間型 (ブランド宣言 11 件)。 | 名前付き `Pluggable` に **Adapt**。attr / math / footnote / toc の書き直しと remark-gfm 追加で slot リストが変わる。 |
| `revive-rehype.ts` | handler と hast 8 slot の組み立て | `import { type Handler, all } from 'mdast-util-to-hast'`。deep import `mdast-util-to-hast/lib/handlers/table.js`。合成 `paragraph` handler は `(h, node)`。`unified.Pluggable` (ブランド宣言 8 件)。 | **Adapt**。v13 はパッケージ ルートから `defaultHandlers.table` を export しており deep import は閉じられる。paragraph handler は `state.all()` を使う `(state, node)` になる。 |
| `utils.ts` | `debug`, `inspect`, `partial`, `brand`, `mergePlugins`, `StripFunctions` | `unified.Plugin` / `unified.Pluggable` 名前空間型。`partial` は attacher が `this.Parser` を読めるように `this` を転送する。 | 型を **Adapt**。`partial` の `this` 転送は残してよい (無害) が、旧 tokenizer が消えれば理由はなくなる。 |
| `cli.ts` | CLI (meow) | なし。 | **Keep**。 |

### `types/remark.d.ts`

型の無い依存 (`hast-util-find-and-replace`, `remark-shortcodes`, `rehype-format`, `remark-breaks`, `remark-attr`, `md-attr-parser`) の ambient 宣言、remark-parse 8 の `Tokenizer` / `TokenizerInstance` の形、グローバルの `KeyValue` 別名。

- `Tokenizer` 型は旧 tokenizer とともに消える。
- `rehype-format` 5、`remark-breaks` 4、`hast-util-find-and-replace` 5 は型を同梱する。
- `remark-shortcodes` と `remark-attr` は書き直しまたは廃止で消える。
- `KeyValue` と `md-attr-parser` の宣言は残すか、使うモジュールへ移す。

### module augmentation の箇所

| ファイル | 対象 | remark 13 での対応物 |
| --- | --- | --- |
| `src/plugins/code.ts` | `unist` `Data` (`hName`, `hProperties`, `hChildren`, `figcaptionTitle`) | `mdast-util-to-hast` 13 が先の 3 つで `Data` を augmentation する |
| `src/plugins/math.ts` | `mdast` `StaticPhrasingContentMap` | `@types/mdast` 4 の `PhrasingContentMap` |
| `src/plugins/toc.ts` | `mdast` `BlockContentMap` | `BlockContentMap` のまま。`shortcode` 型は toc の決定に従う |
| `types/remark.d.ts` | ambient モジュールとグローバル | 上記参照 |

## テスト

| ファイル | 依存 | 影響 |
| --- | --- | --- |
| `tests/utils.ts` | `VFM().freeze()`, `vfm.parse()`, position と `data:` 行を除いた `unist-util-inspect` ダンプ | MDAST 比較はダンプ文字列による。ノード形状の変化 (remark-math の `inlineMath`、remark-gfm の footnote、属性ノードなど) はすべて期待文字列の書き直しになる。HTML 比較は原則として影響なし。 |
| `tests/defs.test.ts` | `vfm.Parser.prototype.inlineMethods` / `blockMethods` / `interrupt*` | 移植不能。micromark 拡張リストのテストに置き換えるか削除する。 |
| `tests/edit-plugins.test.ts` | `unified` 名前空間型、ブランド型、両ツリーでの `visit` | unified 11 への型レベルの適応。挙動は維持されるはず。 |
| `tests/math.test.ts`, `tests/math-mathml.test.ts` | `inlineMath` / `displayMath` のダンプ、`data.value` | remark-math 採用でノード形状が変わる (`data.value` → `value`、`displayMath` → `math`)。 |
| `tests/figure.test.ts` (最大のファイル) | alt 再パース、`Image.children`、段落内の HTML コメント | figure の書き直しに従う。コメント処理 (`isHtmlComment`) は micromark が段落内で `html` ノードをどう出すかに依存する。 |
| `tests/footnotes.test.ts` | remark-footnotes のノード ダンプ、3 つの出力モード | footnote の書き直しに従う。`mdast-util-to-hast` 13 の endnote 構造。 |
| `tests/attr.test.ts`, `tests/code.test.ts` | remark-attr の出力。`hProperties` のダンプは除外される | attr の書き直しが忠実なら HTML 期待値は維持される。 |
| `tests/metadata.test.ts` | `readMetadata` のみ | 見出しからのタイトル抽出 (footnote / ruby 含む) を除き、パーサーからほぼ独立。 |
| `tests/table.test.ts`, `tests/line-breaks.test.ts`, `tests/html-formatter.test.ts`, `tests/html-lang.test.ts`, `tests/markdown-inside-html.test.ts`, `tests/rewrite-relative-href-extensions.test.ts`, `tests/index.test.ts` | GFM table、remark-breaks、rehype-format、document wrapper、`allowDangerousHtml` + rehype-raw | 挙動レベルの検証。rehype-format 5 による整形差と、`markdown-inside-html` での micromark の空白差を見込む。 |

## 変更分類ごとのまとめ

| 変更 | モジュール |
| --- | --- |
| Rewrite | attr, math (パーサー側), footnotes (inline note), toc (または廃止), figure (alt 再パース), index (import / parse オプション) |
| Adapt | code, document, figure (handler + hast), footnotes (handler 振り分け), format, line-breaks, metadata, replace, slug, revive-parse, revive-rehype, utils, types/remark.d.ts |
| Keep | options, rewrite-relative-href-extensions, table, cli |
