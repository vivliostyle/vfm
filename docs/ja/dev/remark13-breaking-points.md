# remark 13 移行: 破壊点

VFM を remark 13 へ移行すると必ず壊れる箇所 (Phase 0-3, [#279](https://github.com/vivliostyle/vfm/issues/279))。各項目に、該当コード、壊れる理由、remark 13 での対応物、修正、担当 Phase、検証方法を記す。最初の 9 件は #279 の一覧で、残りは [`packages/vfm` インベントリ](./remark13-vfm-inventory.md) と [サブパッケージ調査](./remark13-subpackages.md) を書く中で見つけたもの。上流の挙動は 2026-10-17 に pnpm store のパッケージ (`unified` 11.0.5, `remark-parse` 11.0.0, `mdast-util-to-hast` 13.2.1, `hastscript` 9.0.1, `hast-util-raw` 9.1.0, `refractor` 5.0.0) で確認した。

Phase は [#275](https://github.com/vivliostyle/vfm/issues/275) の sub-issue を指す: Phase 2 [#281](https://github.com/vivliostyle/vfm/issues/281) (基盤ライブラリ)、Phase 3 [#285](https://github.com/vivliostyle/vfm/issues/285) (構文プラグインの micromark 化)、Phase 4 [#293](https://github.com/vivliostyle/vfm/issues/293) (検証とテスト)。

## 一覧

| # | 破壊点 | 種類 | Phase |
| --- | --- | --- | --- |
| 1 | 旧 tokenizer 拡張 | 無言で無効 | 3 |
| 2 | to-hast handler の署名 | 実行時エラー | 2 |
| 3 | unified の import 形式 | コンパイル エラー | 2 |
| 4 | remark-parse のオプション | 無言で無効 | 2 |
| 5 | deep import | 解決エラー | 2 |
| 6 | `Image.alt` の再パース | 出力不正 | 3 |
| 7 | 旧 Parser 内部のテスト | テスト失敗 | 4 |
| 8 | `@types/mdast` 4 の型名 | コンパイル エラー | 2 |
| 9 | テストの MDAST 期待値 | テスト失敗 | 4 |
| 10 | hastscript 9 の child / properties 判定 | 出力不正 | 2 |
| 11 | `footnoteById` が `Map` | 実行時エラー | 2 |
| 12 | `mdast-util-to-hast` 13 の endnote footer | 出力不正 | 2 |
| 13 | `refractor` 5 が `Root` を返す | 出力不正 | 2 |
| 14 | `hast-util-raw` 9 の署名 | コンパイル エラー | 2 |
| 15 | inline footnote ノードの消滅 | 無言で無効 | 3 |
| 16 | `math.ts` の `findAndReplace` フォールバック | 出力不正 | 3 |
| 17 | 旧方式の外部プラグイン | 無言で無効 | 3 |
| 18 | サブパッケージのテスト ユーティリティ | テスト失敗 | 4 |

「無言で無効」の項目が危険。ビルドもプロセッサも動き、HTML 出力を見るまで構文がパースされていないことに気付けない。

## #279 の項目

### 1. 旧 tokenizer 拡張

- **場所**
  - `packages/vfm/src/plugins/math.ts` (`mdast`)
  - `packages/remark-ruby/src/ruby.ts` (`mdast`)
- **理由**
  - 両者とも tokenizer を `this.Parser.prototype.inlineTokenizers` / `inlineMethods` に付ける。remark-parse 10 以降は `this.parser` (小文字) に `mdast-util-from-markdown` のラッパーを設定し、unified 11 には `Parser` が無いため、`this.Parser` は `undefined`。両プラグインはこれをガードにしており (`if (!this.Parser) return`)、何もしない。`$...$` と `{base|ruby}` の構文はプレーンテキストとして出る。
- **対応物**
  - `this.data('micromarkExtensions')` で登録する micromark 構文拡張
  - `this.data('fromMarkdownExtensions')` で登録する `mdast-util-from-markdown` 拡張
  - remark-parse 11 は両リストを読む。
- **修正**
  - 両者を micromark + from-markdown 拡張として書き直す。
  - math は remark-math 6 が候補 ([#224](https://github.com/vivliostyle/vfm/issues/224))。ノード名 (`inlineMath` / `math`) とフィールド (`value`) が VFM (`inlineMath` / `displayMath`, `data.value`) と異なるため、handler を変えるか VFM 拡張で旧形状を保つ。
  - ruby はベース テキストを micromark にトークン化させるインライン拡張が必要で、入れ子のインライン記法を維持する。
- **検証**
  - `tests/math.test.ts`
  - `tests/math-mathml.test.ts`
  - `packages/remark-ruby/tests/ruby.test.ts`
  - 構文が無言で未パースだと失敗するテストを足す (例: math テストの出力にリテラルの `$` が残らないことを確認する)。

### 2. to-hast handler の署名

- **場所**
  - `math.ts` (`handlerInlineMath`, `handlerDisplayMath`)
  - `math.ts` (`buildDisplayMath`、ノードのみ受け取る)
  - `code.ts` (`handler`)
  - `revive-rehype.ts` (`paragraph`)
  - `figure.ts` (`buildFigure`)
  - `remark-ruby` (`handler`)
  - `mdast-to-hast-table-cell` (`withTableCellTransform`, `TableCellHook`)
  - `remark-footnote-dpub` / `gcpm` (各 3 handler)
- **理由**
  - `mdast-util-to-hast` 13 は handler を `(state, node, parent)` で呼ぶ。`h(node, tagName, props, children)` は無くなり、`all` と `one` は export されない。
- **対応物**
  - `state.all(node)`
  - `state.one(node, parent)`
  - `state.patch(node, element)` (position をコピー)
  - `state.applyData(node, element)` (`hName` / `hProperties` / `hChildren` を適用)
  - 要素は plain object か hastscript で組む。
- **修正**
  - 各 handler を変換する。`{ h }` を受け取る `mdast-to-hast-table-cell` の公開型 `TableCellHook` は `{ state }` か絞った部分集合になる。
- **検証**
  - 全 handler テストの HTML 期待値
  - `editPlugins` による handler 置き換えは `tests/edit-plugins.test.ts`

### 3. unified の import 形式

- **場所**
  - `packages/vfm/src/index.ts`
  - `packages/vfm/src/utils.ts`
  - `packages/vfm/src/revive-parse.ts`
  - `packages/vfm/src/revive-rehype.ts`
  - `packages/vfm/src/plugins/metadata.ts`
  - `packages/vfm/src/plugins/figure.ts`
  - `packages/vfm/src/plugins/footnotes.ts`
  - `packages/vfm/src/plugins/math.ts`
  - `remark-footnote-{dpub,gcpm,pandoc}`
  - すべてのテスト ユーティリティ
- **理由**
  - unified 10 以降は `{ unified }` と名前付き型 (`Plugin`, `Pluggable`, `PluggableList`, `Processor`, `Transformer`) を export する。`import unified from 'unified'` と `unified.Plugin` はコンパイルできない。
- **対応物**
  - `import { unified, type Plugin, type Pluggable } from 'unified'`。`Plugin` はパラメーターとツリー型のジェネリック。
- **修正**
  - 機械的な置き換え。`utils.ts` の `brand<T>()`、`mergePlugins`、`partial` は名前付き型でそのままの形を保てる。`metadata.ts` の `unified.PluggableList<unified.Settings>` キャストは削除する。
- **検証**
  - workspace 全体の `tsc`

### 4. remark-parse のオプション

- **場所**
  - `packages/vfm/src/index.ts` (`VFM()`)
  - `packages/vfm/src/plugins/metadata.ts` (`parseMarkdown`)
  - すべてのサブパッケージ テスト ユーティリティ
  - いずれも `[remarkParse, { gfm: true, commonmark: true }]` を渡している。
- **理由**
  - remark-parse 11 はオプションを `mdast-util-from-markdown` に転送するが、そこに `gfm` や `commonmark` は無い。モードは CommonMark のみ。この呼び出しは旧型でしか型検査を通らず、実行時には何もしないため、remark-gfm を足すまで GFM の table、取り消し線、autolink リテラル、footnote 参照はパースされない。
- **対応物**
  - GFM ノードを読むプラグインより前の mdast slot としての `remark-gfm` 4
- **修正**
  - オプションを slot リストの `remarkGfm` に置き換える。`.data('settings', { position })` も `fromMarkdown` に転送されて無視される。position は常に付く。
- **検証**
  - `tests/table.test.ts`
  - `tests/footnotes.test.ts`
  - GFM 構文を含むテストの MDAST ダンプ

### 5. deep import

- **場所**
  - `packages/vfm/src/revive-rehype.ts`
  - `packages/mdast-to-hast-table-cell/tests/utils.ts`
  - `packages/mdast-to-hast-table-cell/tests/composition.test.ts`
  - いずれも `mdast-util-to-hast/lib/handlers/table.js` を import している。
- **理由**
  - `mdast-util-to-hast` 13 は `"exports": "./index.js"` を持ち、`lib/` 配下のパスは解決できない。
- **対応物**
  - `import { defaultHandlers } from 'mdast-util-to-hast'` と `defaultHandlers.table`
- **修正**
  - import を置き換える。あわせて VFM 自身のパッケージに `exports` を付けるか決める。README の `@vivliostyle/vfm/lib/revive-parse` deep import は `exports` が無いことに依存している。
- **検証**
  - ビルド
  - `packages/mdast-to-hast-table-cell/tests`

### 6. `Image.alt` の再パース

- **場所**
  - `packages/vfm/src/plugins/figure.ts` (`parseImageAltAsInline`): `this.parse(image.alt)`
- **理由**
  - remark-parse 8 は alt テキストの生ソースを保持していたため、`![**bold** caption](a.png)` の `alt` にアスタリスクが残り、プラグインがそれを再パースできた。micromark はプラグインが動く前に `alt` をプレーンテキスト (`bold caption`) に decode するので、再パースする対象が残らない。`this.parse` 自体は unified プロセッサに引き続き存在する。
- **対応物**
  - 生のキャプションはトークン化中にしか得られない。from-markdown 拡張で画像ラベルのソース スライスを記録する (例: `data.rawAlt`) か、ラベルの子トークンを保持する。
- **修正**
  - 再パースを、画像ラベルのインライン子要素を保持する VFM 拡張に置き換え、`buildFigure` がそれを読むようにする。非標準の `Image.children` の慣習は型付きフィールドにする。
- **検証**
  - `tests/figure.test.ts`、特に `parseFigcaptionAsInline` のケースと alt 導出 (`deriveImgAltFromFigcaption`)

### 7. 旧 Parser 内部のテスト

- **場所**
  - `packages/vfm/tests/defs.test.ts` (6 件)。検証対象:
    - `vfm.Parser.prototype.inlineMethods`
    - `blockMethods`
    - `interruptParagraph`
    - `interruptList`
    - `interruptBlockquote`
    - `interruptFootnoteDefinition`
- **理由**
  - remark-parse 11 にはいずれも存在しない。
- **対応物**
  - freeze したプロセッサの `this.data('micromarkExtensions')` と `this.data('fromMarkdownExtensions')` のリスト
- **修正**
  - 登録された拡張 (件数または同一性) を検証するテストに置き換えるか、ファイルを削除して挙動テストに任せる。
- **検証**
  - 置き換えたテスト自体

### 8. `@types/mdast` 4 の型名

- **場所**
  - `packages/vfm/src/plugins/math.ts` (`StaticPhrasingContentMap`)
  - `packages/vfm/src/plugins/toc.ts` (`Content`, `BlockContentMap`)
  - `packages/vfm/src/plugins/code.ts` (`unist` `Data` の augmentation)
  - `packages/vfm/types/remark.d.ts`
  - `packages/remark-ruby/src/ruby.ts` (`unist` `Data`)
  - `packages/remark-sectionize/src/section.ts` (`Content`, `HTML`, `BlockContentMap`, `unist` `Data`)
  - `packages/mdast-to-hast-table-cell/tests/rehype-format.d.ts`
- **理由**
  - `@types/mdast` 4 は `StaticPhrasingContentMap` を `PhrasingContentMap` に、`Content` を `RootContent` に、`HTML` を `Html` に改名し、`Content` union を廃止した。`@types/unist` 3 の `Data` は `mdast-util-to-hast` 13 自身が augmentation する (`hName`, `hProperties`, `hChildren`) ため、ローカルの augmentation は重複になる。
- **対応物**
  - `PhrasingContentMap`
  - `BlockContentMap` (変更なし)
  - `RootContent`
  - `Html`
  - `Data` フィールドには `import 'mdast-util-to-hast'`
- **修正**
  - 改名し、重複した `Data` augmentation を削除する (`code.ts` の `figcaptionTitle` と ruby の `rubyText` は残す)。`rehype-format` 5 が型を同梱したら `rehype-format.d.ts` を削除する。
- **検証**
  - `tsc`

### 9. テストの MDAST 期待値

- **場所**
  - `buildProcessorTestingCode` (`tests/utils.ts`) を使うすべての `packages/vfm/tests/*.test.ts`。MDAST は position と `data:` 行を除いた `unist-util-inspect` のダンプとして比較される。
- **理由**
  - 新しい構文でノード形状が変わり、`unist-util-inspect` 8 の書式も変わりうる。影響するノード:
    - remark-math の `inlineMath` / `math`
    - remark-gfm の footnote ノード
    - attr 書き直しによる属性の運搬ノード
    - ruby と inline note のノード
- **修正**
  - 各構文が揃うたびに期待ダンプを再生成し、差分を手で確認する。挙動の検証は HTML 期待値に任せる。
- **検証**
  - テスト自体。変更が最も大きい見込みのファイル:
    - `figure.test.ts`
    - `math.test.ts`
    - `footnotes.test.ts`
    - `code.test.ts`

## Phase 0-1 / 0-2 で見つかった項目

### 10. hastscript 9 の child / properties 判定

- **場所**
  - `packages/vfm/src/plugins/document.ts`: `h('head', ...createHead())` (`h('html', props, [u('text', '\n'), ...])` は問題なし)
  - `packages/remark-footnote-dpub/src/index.ts`: `h('sup', u('text', '1'))`
  - `buildElement` に渡されるユーザー定義の `ElementFactory`
- **理由**
  - hastscript 9 は第 2 引数が properties かどうかを `isChild` 判定で決める。オブジェクトが child と見なされるのは、(文字列 / 数値の配列以外の) オブジェクト値のフィールドか `children` 配列を持つ場合のみ。text ノード `{ type: 'text', value: '\n' }` はどちらも持たないため properties と扱われ、`type="text" value="..."` 属性として描画され、テキスト子要素が無くなる。
- **対応物**
  - children を 1 つの配列で渡すか、明示的な properties オブジェクトの後に渡す: `h('sup', {}, u('text', '1'))`。
- **修正**
  - 第 2 引数が text ノードになりうる `h()` 呼び出しをすべて監査する。hastscript 7 はこれを受け付けていた。
- **検証**
  - `tests/index.test.ts` (document wrapper、`<head>` の内容)
  - `packages/remark-footnote-dpub/tests`

### 11. `footnoteById` が `Map`

- **場所**
  - `packages/remark-footnote-dpub/src/index.ts`
  - `packages/remark-footnote-gcpm/src/index.ts`
  - アクセス箇所: `identifier in ctx.footnoteById`、`ctx.footnoteById[id]`、`ctx.footnoteById[identifier] = ...`
- **理由**
  - `mdast-util-to-hast` 13 の `state.footnoteById` は `String(identifier).toUpperCase()` をキーとする `Map<string, FootnoteDefinition>`。`in` 判定とインデックス アクセスは `false` / `undefined` を返し、代入は `state` が決して読まない own property を追加する。
- **対応物**
  - `state.footnoteById.has(id)`、`.get(id)`、`.set(id, def)`
  - `state.footnoteOrder` と `state.footnoteCounts` が採番と重複を追跡する。
- **修正**
  - アクセスを変換する。パッケージ独自のカウンターの代わりに `footnoteOrder` / `footnoteCounts` を使うことを検討する。
- **検証**
  - `packages/remark-footnote-{dpub,gcpm}/tests`
  - `tests/footnotes.test.ts`

### 12. `mdast-util-to-hast` 13 の endnote footer

- **場所**
  - `packages/remark-footnote-pandoc/src/index.ts` のセレクター:
    - `div.footnotes`
    - `li[id^="fn-"]`
    - `sup[id^="fnref-"]:has(a:only-child[href^="#fn-"].footnote-ref)`
    - `a.footnote-backref`
- **理由**
  - 現在のセレクターはどれも v13 の footer に一致せず、transformer は既定 footer を触らずに残す。v13 の footer:
    - Area: `<section data-footnotes class="footnotes">` と `<h2 id="footnote-label" class="sr-only">`
    - Element: `<li id="user-content-fn-id">`
    - Call: `<sup><a href="#user-content-fn-id" id="user-content-fnref-id" data-footnote-ref aria-describedby="footnote-label">`
    - Backlink: `<a href="#user-content-fnref-id" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference N">`
- **対応物**
  - `remark-rehype` 11 のオプション: `clobberPrefix`、`footnoteLabel`、`footnoteLabelTagName`、`footnoteLabelProperties`、`footnoteBackLabel`、`footnoteBackContent`
  - カスタム `footnoteReference` / `footnoteDefinition` handler と `state.footnoteOrder` から組む footer
- **修正**
  - セレクターを v13 footer に合わせて書き直すか、handler から Pandoc 構造を直接出力する (推奨。サブパッケージ調査を参照)。
- **検証**
  - `packages/remark-footnote-pandoc/tests`
  - `tests/footnotes.test.ts`

### 13. `refractor` 5 が `Root` を返す

- **場所**
  - `packages/vfm/src/plugins/code.ts` (`mdast`): `node.data.hChildren = refractor.highlight(value, lang)`
- **理由**
  - refractor 3 は hast ノードの配列を返した。refractor 4 以降は `{ type: 'root', children }` を返す。root を `hChildren` に代入すると `<code>` の中に `root` が入れ子になる。`rehype-stringify` は実際にはその children を描画するが、`hChildren` の型付けと、要素コンテンツを期待する hast コンシューマーは壊れる。
- **対応物**
  - `refractor.highlight(value, lang).children`
- **修正**
  - `.children` を取る。refractor 5 は default export も廃止して `import { refractor } from 'refractor'` になり、言語登録は `refractor/<lang>` パスに移る。
- **検証**
  - `tests/code.test.ts` のハイライト ケース

### 14. `hast-util-raw` 9 の署名

- **場所**
  - `packages/vfm/src/plugins/figure.ts` (`parseHtml`): `raw(u('root', [u('raw', value)]))`
- **理由**
  - `hast-util-raw` 9 は名前付き export の `raw(tree, options)` で `Nodes` を返す。default export は無くなり、`raw` ノード型は `mdast-util-to-hast` の augmentation で宣言する必要がある。
- **対応物**
  - `import { raw } from 'hast-util-raw'`。`raw(tree)` は `raw` 子要素を持つ root を引き続き受け付ける。
- **修正**
  - import と戻り値の型キャストを更新する。
- **検証**
  - `tests/figure.test.ts` の画像段落内に HTML コメントがあるケース

### 15. inline footnote ノードの消滅

- **場所**
  - `packages/vfm/src/plugins/slug.ts` (`child.type !== 'footnote'` のフィルター)
  - `packages/vfm/src/plugins/metadata.ts` (`child.type !== 'footnote'` のフィルター)
  - `packages/vfm/src/plugins/footnotes.ts` (`inlineNotes: true`)
  - `remark-footnote-dpub` / `gcpm` の `footnote` handler
  - `tests/footnotes.test.ts`
- **理由**
  - `remark-footnotes` 2 は `^[text]` に対して `footnote` ノードを生成した。remark-gfm 4 に inline note は無いため、このノード型は決して現れず、`^[text]` はリテラルのテキストとして描画される。フィルターと handler はエラー無しに dead code になる。
- **対応物**
  - 上流には無い。VFM の micromark 拡張で構文とノードを定義する必要がある。
- **修正**
  - inline note 拡張を最初に書く (slug、metadata、footnote パッケージの共通依存)。ノード型名が変わるなら更新する。
- **検証**
  - `tests/footnotes.test.ts` の inline ケース
  - `tests/metadata.test.ts` の footnote 付きタイトル抽出

### 16. `math.ts` の `findAndReplace` フォールバック

- **場所**
  - `packages/vfm/src/plugins/math.ts` (`mdast`)、`this.Parser` が無いときに通る分岐
- **理由**
  - このフォールバックは「remark 13 以降」向けに書かれたが、パース後に `text` ノード上で動く。`$**x**$` はすでに `text('$'), strong, text('$')` になっているため正規表現は数式全体を見られず、tokenizer が除外していた (`notInLink`) コード スパンやリンク内の `$` に一致してしまう。remark 13 ではこの分岐が実行される (#1 参照) ので、math の出力は欠落ではなく不正になる。
- **修正**
  - tokenizer とともにフォールバックを削除し、micromark 拡張へ移る。
- **検証**
  - `tests/math.test.ts` の数式内インライン記法のケースと、コード内の `$` のケース

### 17. 旧方式の外部プラグイン

- **場所**
  - `remark-attr` 0.11 (`attr.ts`, `remark-sectionize` テスト)
  - `remark-shortcodes` 0.3 (`toc.ts`)
  - `remark-footnotes` 2 (`footnotes.ts`, footnote パッケージのテスト)
  - `remark-breaks` 1 (`line-breaks.ts`, `remark-ruby` テスト)
- **理由**
  - 4 つとも `this.Parser.prototype` を書き換える。`this.Parser` が undefined だと早期 return するため、属性、`[[toc]]`、footnote、hard break がエラー無しに動かなくなる。`code.ts` には `meta` が空のとき remark-attr がコード内容を属性としてパースする問題の回避策もあり、これは dead code になる。
- **対応物**
  - `remark-breaks` 4 (transformer、置き換えのみ)
  - `remark-gfm` 4 (footnote の参照と定義)
  - 属性と inline note の VFM 拡張
  - `[[toc]]` を残すなら `remark-directive` 4 か block 拡張 ([#207](https://github.com/vivliostyle/vfm/issues/207))
- **修正**
  - プラグインごとにサブパッケージ調査を参照。`code.ts` の remark-attr 回避策を削除する。
- **検証**
  - `tests/attr.test.ts`
  - `tests/code.test.ts`
  - `tests/line-breaks.test.ts`
  - `tests/metadata.test.ts` (`[[toc]]` 検出)
  - `packages/remark-sectionize/tests` (`{hidden}`)

### 18. サブパッケージのテスト ユーティリティ

- **場所**
  - `packages/remark-ruby/tests/ruby.test.ts`
  - `packages/remark-footnote-{dpub,gcpm,pandoc}/tests/*.test.ts`
  - `packages/remark-sectionize/tests/utils.ts`
  - `packages/mdast-to-hast-table-cell/tests/utils.ts`
- **理由**
  - それぞれ `import unified from 'unified'`、`remark-parse` 8 オプション、`devDependencies` の `remark-footnotes` / `remark-attr` / `remark-breaks` 1 で独自のプロセッサを組んでいる。#1、#3、#4、#5、#17 に同時に当たる。
- **修正**
  - 各ユーティリティをパッケージと一緒に移植する。使うもの:
    - `{ unified }`
    - remark-gfm
    - remark-breaks 4
    - できあがり次第 VFM の inline note と属性拡張
    - `defaultHandlers.table`
- **検証**
  - パッケージごとの `pnpm test`

## 修正間の依存関係

- #15 (inline note ノード) と #17 (属性拡張) は #1、#6、#9、#11、#12、#18 の入力になる。handler やテストを移植する前に、この 2 つのノード形状を定義する。
- #2 と #11 は footnote パッケージごとに一緒に行う。
- #4 (remark-gfm) は footnote や table のテストが通る前に入れる必要がある。
- #10、#13、#14 は独立したライブラリ適応で、Phase 2 の最初にできる。
