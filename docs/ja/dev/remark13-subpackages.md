# remark 13 移行: サブパッケージと外部プラグイン

remark 13 移行に向けた、`packages/` 配下のサブパッケージと VFM が依存する外部 remark / rehype プラグインの調査 (Phase 0-2, [#278](https://github.com/vivliostyle/vfm/issues/278))。[remark13-migration.md](./remark13-migration.md) の要約を展開したもので、[`packages/vfm` インベントリ](./remark13-vfm-inventory.md) を補完する。2026-10-17 時点の `main` を対象に調査し、上流の挙動は pnpm store にすでにあるパッケージ (`mdast-util-to-hast` 13.2.1, `hastscript` 9.0.1, `remark-rehype` 11.1.2) で確認した。

変更分類はインベントリと同じ: **Rewrite** (仕組みが消える)、**Adapt** (同じ仕組みで API が変わる)、**Keep** (型の更新のみ)。

## サブパッケージ

| パッケージ | バージョン | 段階 | 影響 | 変更 |
| --- | --- | --- | --- | --- |
| `@vivliostyle/remark-ruby` | 1.0.1 | 旧 tokenizer + handler | 大 | Rewrite |
| `@vivliostyle/remark-footnote-dpub` | 1.0.1 | handler ×3 + hast | 中 | Adapt (handler), Rewrite (inline note の供給元) |
| `@vivliostyle/remark-footnote-gcpm` | 1.0.1 | handler ×2 | 中 | Adapt (handler), Rewrite (inline note の供給元) |
| `@vivliostyle/remark-footnote-pandoc` | 1.0.1 | hast のみ | 中 | Rewrite (セレクターが上流出力に追従) |
| `@vivliostyle/remark-sectionize` | 1.0.1 | mdast transformer | 小 | Adapt (型、ユーティリティの major) |
| `@vivliostyle/mdast-to-hast-table-cell` | 0.0.0 | handler ラッパー | 中 | Adapt (handler 署名、deep import) |
| `@vivliostyle/rehype-rewrite-extension` | 0.0.0 | hast のみ | 小 | Keep |
| `@vivliostyle/vfm-internal-utils` | 1.0.1 | hastscript ヘルパー | 小 | Keep |

共通する特徴:

- どのパッケージにも `exports` フィールドが無い。すべて `lib/` を publish し、`main` / `types` がコンパイル済みエントリーを指す。
- `mdast-util-to-hast` に触れるパッケージはすべて 11.3 に直接依存し、同時に `remark-rehype` 8 が 10.2 を引き込む。handler 署名と `footnoteById` の形は 11 から、endnote footer の出力は 10 から来ている。
- すべてのテスト スイートが `devDependencies` の `remark-parse` 8 オプション (`{ gfm: true, commonmark: true }`)、`remark-footnotes`、`remark-attr` で独自のプロセッサを組んでいる。テスト ユーティリティはすべて `packages/vfm/src/index.ts` と同じ書き直しが必要。
- 以下は共通で、まとめて更新する:
  - `hast-util-select` 5
  - `unist-builder` 3
  - `unist-util-visit` 4
  - `hastscript` 7
  - `@types/{hast,mdast,unist}` 2/3/2

### `remark-ruby`

ソース: `packages/remark-ruby/src/ruby.ts`。

- **パーサー**
  - `{base|ruby}` 用の inline tokenizer を `this.Parser.prototype.inlineTokenizers` / `inlineMethods` の `text` の前に登録する。`this.tokenizeInline(inlineContent, now)` を呼んでベース テキストを再帰的にパースするため、ルビの中に強調、コード、その他のインライン記法を含められる。remark 13 はこの登録を無言で無視する。
- **型**
  - `Eat`、`Parser`、`Tokenizer` を `remark-parse` から import しているが、それは `devDependency` にしかないため、公開している `.d.ts` は remark-parse 無しでは利用できない。
  - ローカルの `Tokenizer` 型は remark-parse 8 の型定義の欠落を補っている:
    - `this.tokenizeInline`
    - `eat.now()`
    - 省略不可の `Point.offset`
  - `unist` の `Data` に `hName` を augmentation。
- **handler**
  - `(h, node)` で `h(node, 'ruby', [...all(h, node), rt])` を返す。`rt` のテキストは `data.rubyText` で運ぶ。
- **変更**
  - パーサーを micromark 拡張と `mdast-util-from-markdown` 拡張 (`children` と `rubyText` を持つ `ruby` ノードを組む `enter` / `exit` handler) として書き直す。難所は入れ子のインライン パース: ベース テキストを文字列から再パースするのではなく micromark にパースさせるため、拡張は `{` … `|` をインライン コンテナーとしてトークン化する必要がある。
  - handler は `state.all(node)` と `state.patch` / `state.applyData` を使う `(state, node)` になる。
  - `remark-parse` の型 import と `Data` の augmentation を削除する。
- **テスト**
  - `tests/ruby.test.ts` は `remark-parse` 8 + `remark-breaks` 1 + `remark-rehype` 8 を組んで handler を登録する。期待値は HTML 文字列なので、出力を再現できれば維持できる。

### `remark-footnote-dpub` と `remark-footnote-gcpm`

ソース: `packages/remark-footnote-dpub/src/index.ts`、`packages/remark-footnote-gcpm/src/index.ts`。

両パッケージとも `footnoteReference` と `footnote` の handler を上書きし (dpub は `footnoteDefinition` も)、カスタマイズ可能な要素には `@vivliostyle/vfm-internal-utils` の `buildElement` を使う。

- **handler の状態**
  - handler は `(ctx, node)` で、`ctx.footnoteById` を plain object として読む:
    - `identifier in ctx.footnoteById`
    - `ctx.footnoteById[id]`
    - inline note での代入
  - `mdast-util-to-hast` 13 の `state.footnoteById` は `String(identifier).toUpperCase()` をキーとする `Map` (正規化は現在と同じ) なので、すべてのアクセスが `has` / `get` / `set` になる。`all(ctx, node)` は `state.all(node)` になる。
- **inline note**
  - `footnote` handler は `remark-footnotes` が生成する inline note ノード (`^[...]`) を消費し、その場で `footnoteDefinition` を合成する。remark-gfm 4 に inline note は無いため、VFM の inline note 拡張ができるまでこの handler への入力は無い。ノード型と形は VFM が定義するものなので、handler はその定義に対して書くべき。
- **採番**
  - 両パッケージは handler 呼び出し時に `refIndex` を割り当て、dpub は最終の hast パスで採番し直す。これは `mdast-util-to-hast` < 12.1.1 が table cell を逆順に走査していたため ([#129](https://github.com/vivliostyle/vfm/issues/129))。v13 では走査順が文書順なので、採番し直しは恒等変換になり、安全網として残すか削除できる。v13 の既定 handler は重複も自身で追跡する (`state.footnoteCounts`、`-2` 接尾辞) が、カスタム handler はこれを使っていない。
- **hastscript**
  - dpub は `h('sup', u('text', '1'))` を組む。hastscript 9 は properties 位置に渡された plain な text ノードを properties として扱う (`isChild` 判定は、値が文字列だけのオブジェクトに対して false を返す) ため、`<sup>` に `type` / `value` 属性が付いてテキストが無くなる。children は配列で渡すか、text ノードを明示的に組む。properties オブジェクトを明示している呼び出し (`h('a', {...}, child)`) は影響を受けない。
- **dpub transformer**
  - `createReplaceDpubPlaceholders` は `<div data-footnote-placeholder>` をキューされた `<aside>` で置き換え、inline note の aside を最も近い非 flow container 祖先の後に挿入する hast transformer。hast と `hast-util-select` にしか依存しないので、ユーティリティの major 更新で適応できる。
- **gcpm**
  - `hastTransformer` は no-op で、すべて handler 内で処理する。`hastTransformer: unified.Plugin` は名前空間型を使う。
- **変更**
  - handler を `Map` API を使う `(state, node)` に Adapt する。
  - inline note ノード定義に追従する。
  - `h('sup', textNode)` を修正する。
  - `unified.Plugin` を名前付き `Plugin` 型に置き換える。
- **テスト**
  - `tests/dpub.test.ts` と `tests/gcpm.test.ts` は `remark-footnotes` でプロセッサを組み HTML を比較する。inline note のケースには新しい拡張が必要。それ以外は維持できるはず。

### `remark-footnote-pandoc`

ソース: `packages/remark-footnote-pandoc/src/index.ts`。

- **仕組み**
  - handler は無い (`toHastHandlers` はすべて `undefined`)。2 つの hast transformer が `mdast-util-to-hast` 10 の出す endnote マークアップを Pandoc 風の `<section role="doc-endnotes">` に書き換え、呼び出しを文書順で採番し直し、重複参照にバックリンクを追加する。
- **依存**
  - すべてのセレクターが v10 の footer に固定されている:
    - `div.footnotes`
    - `li[id^="fn-"]`
    - `sup[id^="fnref-"]:has(a:only-child[href^="#fn-"].footnote-ref)`
    - `a.footnote-backref`
  - v13 の footer はセレクターが触れるすべての点で異なる:

    | | `mdast-util-to-hast` 10 | `mdast-util-to-hast` 13 |
    | --- | --- | --- |
    | Area | `<div class="footnotes">` | `<section data-footnotes class="footnotes">` と `<h2 id="footnote-label" class="sr-only">Footnotes</h2>` |
    | Element | `<li id="fn-ID">` | `<li id="user-content-fn-id">` |
    | Call | `<sup id="fnref-ID"><a href="#fn-ID" class="footnote-ref">` | `<sup><a href="#user-content-fn-id" id="user-content-fnref-id" data-footnote-ref aria-describedby="footnote-label">` |
    | Backlink | `<a href="#fnref-ID" class="footnote-backref">` | `<a href="#user-content-fnref-id" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference N">` |
    | 重複 | 未対応 | 呼び出し id に `-2`, `-3` 接尾辞と追加のバックリンク |

  - `remark-rehype` 11 は、`user-content-` 接頭辞とラベル見出しを除去し、バックリンクの内容を調整するオプションを公開している:
    - `clobberPrefix`
    - `footnoteLabel`
    - `footnoteLabelTagName`
    - `footnoteLabelProperties`
    - `footnoteBackLabel`
    - `footnoteBackContent`
- **変更**
  - セレクターと呼び出し / バックリンクの書き換えを v13 の footer に合わせて書き直すか、(推奨) 既定 footer の後処理をやめて、カスタムの `footnoteReference` / `footnoteDefinition` handler と `state.footnoteOrder` から組む footer で Pandoc 構造を直接出力する。後者は上流のマークアップ変更からパッケージを独立させる。
  - v13 は重複参照も文書順も処理するため、重複と採番し直しのロジックは簡略化できる。
  - ローカルの `mergePlugins` コピーと `unified.Plugin` は名前付き型に置き換える。
- **テスト**
  - `tests/pandoc.test.ts` はパイプライン全体の HTML を比較する。すべての期待値が選択する出力と `clobberPrefix` の決定に依存する。

### `remark-sectionize`

ソース: `packages/remark-sectionize/src/section.ts`。

- **仕組み**
  - mdast transformer。見出しを depth 6 から 1 の順に visit し、各見出しとそれに続く兄弟を `data.hName` / `data.hProperties` を持つ `section` ノードで包む。`position` のオフセットでソースから元の見出し行を読み、閉じハッシュ (`## Title ##` はセクション化しない) と終了マーク (`##` 単独でセクションを閉じる) を検出する。
- **依存**
  - `@types/mdast` 3 の `Content` と `HTML` (4 では `RootContent` と `Html`)
  - `unist-util-find-after` 4 と `unist-util-visit-parents` 5 (現在は 5 と 6)
  - `vfile` 4 の `file.toString()` (6 でも動く)
  - `remark-attr` が `{hidden}` から設定する `heading.data.hProperties.hidden`。attr の書き直しに追従する
  - `BlockContentMap` と `unist` の `Data` を augmentation。
  - 残っている `node.type === 'export'` の判定は MDX 時代の remark のもので、何にも一致しない。
- **変更**
  - 型とユーティリティの major を Adapt。オプトアウトと終了マークの検出は AST ではなくソース テキストを読むため、閉じシーケンス付き見出しと `##` 単独行で micromark が同じ `position` を与えることを Phase 4 で検証する。
- **テスト**
  - `tests/utils.ts` は `{hidden}` のために `remark-attr` と `remark-parse` 8 オプションを使い、`rehype-format` と `remark-attr` を `@ts-expect-error` 付きで import している。

### `mdast-to-hast-table-cell`

ソース: `packages/mdast-to-hast-table-cell/src/index.ts`。

- **仕組み**
  - `withTableCellTransform(hook)(handler)` が `table` handler をラップし、実行結果からすべての `th` / `td` を集め、各セルを hook の出力で置き換える。hook は `{ h }` とセル コンテキスト (`node`、`tagName`、`align`、`properties`、`children`) を受け取る。3 つのプリセットは `align` 属性を属性、class、インライン style のいずれかに移す。
- **依存**
  - `mdast-util-to-hast` 11 の `H` と `Handler` 型。ラッパーと hook は `(h, node, parent)`。
  - `cell.properties.align` を読むが、v13 の `tableRow` handler もこれを設定するためセル検出は成立する。
  - テストが `mdast-util-to-hast/lib/handlers/table.js` を deep import しており、v13 は `exports` で閉じる。v13 はルートから `defaultHandlers.table` を export する。
  - `hast-util-get-attribute` 1 と `hast-util-get-class-list` 1 に新しい major は無い。
- **変更**
  - ラッパーを `(state, node, parent)` に Adapt し、hook には `h` ではなく `state` (または絞った部分集合) を渡す。これは公開型 `TableCellHook` の変更になる。
  - テストの deep import を `defaultHandlers.table` に置き換える。
  - `rehype-format` 5 が型を同梱したら `tests/rehype-format.d.ts` を削除する。
- **テスト**
  - `tests/table.test.ts` と `tests/composition.test.ts` は `remark-parse` 8 + `remark-rehype` 8 で HTML を比較する。13 では GFM table は remark-gfm から来る。

### `rehype-rewrite-extension`

ソース: `packages/rehype-rewrite-extension/src/index.ts`。

- **仕組み**
  - hast transformer。各ルールについて `hast-util-select` で要素を選び、`hast-util-get-attribute` でプロパティを読み、`uri-js` / `upath` で URI パスの拡張子を書き換えて書き戻す。
- **依存**
  - `hast-util-select` 5 (現在は 6)。remark や unified の import は無い。
- **変更**
  - Keep。`hast-util-select` と `@types/hast` を更新する。テストは手で組んだツリーで transformer を直接実行しており変更不要。

### `vfm-internal-utils`

ソース: `packages/vfm-internal-utils/src/element-customizer.ts`。

- **仕組み**
  - `buildElement(tagName, props, children, customizer)` が hastscript で要素を組む。customizer は追加 properties か、tag-aware な `h` を受け取る factory。`HastPropertiesSchema` は `hast.Properties` 用の valibot スキーマ。
- **依存**
  - hastscript 7 の `h`、`Properties`、`Child` 型。すべての呼び出しが明示的な properties オブジェクトを渡す (`h(tagName, props, ...children)`) ため、hastscript 9 の child / properties の曖昧さはここには当たらないが、ユーザーが渡す factory は影響を受けうる。
- **変更**
  - Keep。hastscript を更新し、`TagAwareH` のオーバーロードを hastscript 9 の署名と照合する。

## 外部プラグイン

| プラグイン | 利用元 | 現行 | remark 13 での状況 | 判断 |
| --- | --- | --- | --- | --- |
| remark-attr | vfm (`attr.ts`), remark-sectionize テスト | 0.11.1 | 2020 年から更新停止。remark-parse 8 のすべての inline / block tokenizer をラップして `{...}` 属性を付加する。micromark 移植は無い。 | VFM の属性拡張を書く ([#46](https://github.com/vivliostyle/vfm/issues/46), [#211](https://github.com/vivliostyle/vfm/issues/211))。先行試作: `origin/remark-attribute`。利用側: `code.ts` (fenced code の属性)、`slug.ts` (見出しの `{#id}`)、`remark-sectionize` (`{hidden}`)、`figure.ts` (`{alt=...}`)。 |
| remark-shortcodes | vfm (`toc.ts`, `metadata.ts`) | 0.3.1 | 更新停止。`Parser.prototype.blockTokenizers` を書き換える。 | `[[toc]]` の存廃は [#207](https://github.com/vivliostyle/vfm/issues/207) に従う。残す場合は小さな micromark block 拡張か `remark-directive` 4 (`::toc`) で置き換える。 |
| remark-footnotes | vfm (`footnotes.ts`), footnote パッケージのテスト | 2.0.0 | deprecated。`Parser.prototype` を書き換える。remark-gfm 4 は `[^id]` の参照と定義を提供するが inline note `^[...]` は無い。 | 参照 / 定義には remark-gfm を使う。footnote パッケージが消費するノードを出す inline note の micromark 拡張を書く。 |
| remark-breaks | vfm (`line-breaks.ts`), remark-ruby テスト | 1.0.5 | 4.0.0 は型付きの通常の mdast transformer。 | 更新。 |
| remark-frontmatter | vfm (`revive-parse.ts`, `metadata.ts`) | 2.0.0 | 5.0.0 は型付きの micromark 拡張。 | 更新。 |
| remark-math | – | – | 6.0.0 (`micromark-extension-math` 3.1.0, `mdast-util-math` 3.0.0)。`value` を持つ `inlineMath` / `math` ノードを出す。 | `math.ts` の tokenizer を置き換える候補 ([#224](https://github.com/vivliostyle/vfm/issues/224))。ノード名と `value` フィールドが VFM の `inlineMath` / `displayMath` + `data.value` と異なる。 |
| rehype-raw | vfm, dpub / sectionize / table-cell テスト | 5.1.0 | 7.0.0 (`hast-util-raw` 9)。 | 更新。 |
| rehype-format | vfm (`format.ts`), 全テスト | 3.1.0 | 5.0.1 は型を同梱。 | 更新。ambient 宣言を削除。 |
| rehype-stringify | vfm, 全テスト | 8.0.0 | 10.0.1。 | 更新。 |

### hast / unist ユーティリティ

| パッケージ | 現行 | 移行先 | 利用元 |
| --- | --- | --- | --- |
| hastscript | 7.2.0 | 9.0.1 | vfm, dpub, gcpm, pandoc, vfm-internal-utils |
| hast-util-select | 5.0.5 | 6.0.4 | vfm, dpub, pandoc, rehype-rewrite-extension |
| hast-util-raw | 6.1.0 | 9.1.0 | vfm (`figure.ts`) |
| hast-util-from-html | 1.0.2 | 2.x | vfm (`math.ts`) |
| hast-util-find-and-replace | 3.2.1 | 5.x | vfm (`replace.ts`) |
| hast-util-is-element | 2.1.3 | 3.0.0 | vfm |
| hast-util-get-attribute / get-class-list | 1.x | 1.x | table-cell, rehype-rewrite-extension |
| unist-builder | 3.0.1 | 4.0.0 | vfm, ruby, dpub, pandoc |
| unist-util-visit | 4.1.2 | 5.1.0 | vfm, table-cell |
| unist-util-visit-parents | 5.1.3 | 6.0.2 | vfm, sectionize |
| unist-util-find-after | 4.0.1 | 5.0.0 | vfm, sectionize |
| unist-util-select | 4.0.3 | 5.1.0 | vfm |
| unist-util-remove / filter / inspect | 3 / 4 / 7 | 4 / 5 / 8 | vfm |
| mdast-util-to-string | 3.2.0 | 4.0.0 | vfm |
| mdast-util-find-and-replace | 2.2.2 | 3.x | vfm (`math.ts`、削除予定) |
| refractor | 3.6.0 | 5.0.0 | vfm (`code.ts`) |
| to-vfile / vfile | 6.1 / 4.0 | 8.0 / 6.0 | vfm, sectionize |

## 作業順序

1. まず VFM 独自のノード形状を定義する: inline note、ruby、属性の運搬役、`[[toc]]` (残す場合)。footnote パッケージ、`slug.ts`、`metadata.ts`、`remark-sectionize` がすべてこれらを読む。
2. 共通の hast / unist ユーティリティと `hastscript` を全パッケージで一括更新する。パッケージ同士が `workspace:*` で import し合っているため。
3. `vfm-internal-utils` と `rehype-rewrite-extension` (Keep)、次に `mdast-to-hast-table-cell` と `remark-sectionize` (Adapt)、次に footnote パッケージ、最後に `remark-ruby` を移植する。
4. 各パッケージのテスト ユーティリティはパッケージと一緒に書き直す。remark-parse 8 オプションと `remark-footnotes` / `remark-attr` の devDependencies が残る唯一の場所になる。
