# remark 13 移行ノート

VFM の Markdown ツールチェインを remark 8 / unified 9 から remark 13 以降 (remark-parse 11, unified 11, mdast-util-to-hast 13) へ移行するための作業ノート。Phase 0 の調査結果と移行方針を記録する。進捗は GitHub で管理している。[#275](https://github.com/vivliostyle/vfm/issues/275) が統括 Issue で、各 Phase に sub-issue がある。

| Phase | Issue | 範囲 |
| --- | --- | --- |
| 0 | [#276](https://github.com/vivliostyle/vfm/issues/276) | 現状調査と移行方針 (この文書) |
| 1 | [#280](https://github.com/vivliostyle/vfm/issues/280) | `packages-next/` の足場構築 |
| 2 | [#281](https://github.com/vivliostyle/vfm/issues/281) | 基盤ライブラリ更新 (unified / vfile / mdast-util-to-hast / rehype) |
| 3 | [#285](https://github.com/vivliostyle/vfm/issues/285) | 構文プラグインの micromark 化 |
| 4 | [#293](https://github.com/vivliostyle/vfm/issues/293) | 互換検証とテスト移植 |
| 5 | [#296](https://github.com/vivliostyle/vfm/issues/296) | カレント切り替えと公開 |

Phase 2 と 3 は一部並行できる。Phase 4 は Phase 3 の各構文が揃うたびに部分的に進める。

## 移行方針

- remark 13 以降のコードベースを **next** と呼ぶ。
- モノレポで現行 (`packages/`) と next (`packages-next/`) を併存させる。`packages/` 配下に両世代を混在させると運用しにくいため、ディレクトリーを分ける。
- `packages-next/` は `packages/` をコピーしてから変更してゆく。
- next 系パッケージはすべて `"private": true` にして誤って publish されないようにし、`name` に `-next` を付けて pnpm の `--filter` と `workspace:*` の解決が曖昧にならないようにする。
- 両ツリーを pnpm workspace に含め、ルートの `pnpm build` / `pnpm test` でビルドとテストを行う。
- next が現行 VFM の挙動を再現できたらツリーを入れ替える。`packages/` → `packages-old/`、`packages-next/` → `packages/`。`-next` と `"private": true` を外して major として publish する。

完了条件:

- `packages/` が next 系となり、現行テスト相当がすべて通る。
- `@vivliostyle/vfm` と各サブパッケージが major 更新として publish される。

## 現状 (Phase 0 調査)

2026-10 時点の `main` を対象に調査した。

### ツールチェイン

- ツールチェインは ESM 化済み (`"type": "module"`、tsc 直出力、vitest 4)。CJS 固有のイディオムは残っていない。
- 旧世代なのは依存セットとそれに合わせた書き方のみ: unified 9、remark-parse 8、remark-rehype 8、mdast-util-to-hast 10 と 11 の二重依存、vfile 4、`@types/{unist,mdast,hast}` 2/3/2。
- 全パッケージに `exports` フィールドが無い。README に載せている deep import (`@vivliostyle/vfm/lib/revive-parse`、`@vivliostyle/vfm/lib/revive-rehype`) はこれに依存している。
- この文書を作るまで移行専用のドキュメントは無かった。ソース中の `@todo` / `TODO` コメントが事実上の移行ノートだった:
  - `packages/vfm/src/plugins/code.ts` – `mdast-util-to-hast@>=13` に上げたら hast フィールドを削る
  - `packages/vfm/src/plugins/replace.ts` – `hastscript` が型を公開したら interface の固定をやめる
  - `packages/vfm/src/plugins/figure.ts` – `Image.alt` の再パースは remark-parse 8 の挙動に依存
  - `packages/remark-ruby/src/ruby.ts` – `mdast-util-to-hast@>=13` に上げたら `hName` を削る
  - `packages/remark-sectionize/src/section.ts` – `mdast-util-to-hast@>=13` に上げたら hast フィールドを削る。`@subtitle` の扱い

### 移行先バージョン

2026-10-17 時点の最新 (2026-09 調査時から変化なし)。

| パッケージ | 現行 | 移行先 |
| --- | --- | --- |
| unified | 9.2 | 11.0.5 |
| remark-parse | 8.0 | 11.0.0 |
| remark-rehype | 8.1 | 11.1.2 |
| remark-gfm | – | 4.0.1 |
| mdast-util-to-hast | 10 / 11.3 | 13.2.1 |
| rehype-raw | 5.1 | 7.0.0 |
| rehype-stringify | 8.0 | 10.0.1 |
| rehype-format | 3.1 | 5.0.1 |
| vfile | 4.0 | 6.0.3 |
| to-vfile | 6.1 | 8.0.0 |
| hastscript | 7.2 | 9.0.1 |
| refractor | 3.6 | 5.0.0 |
| unist-util-visit | 4.1 | 5.1.0 |
| micromark | – | 4.0.3 |
| mdast-util-from-markdown | – | 2.1.0 |
| @types/mdast | 3 | 4.0.4 |
| @types/hast | 2 | 3.0.5 |
| @types/unist | 2 | 3.0.3 |

### `packages/vfm` の実装分類 ([#277](https://github.com/vivliostyle/vfm/issues/277))

remark パイプラインへの関与の仕方で分類した。各ファイルの remark 8 依存箇所と影響するテストまで含めたモジュール単位のインベントリは [remark13-vfm-inventory.md](./remark13-vfm-inventory.md) にある。

| 分類 | 件数 | 対象 |
| --- | --- | --- |
| remark-parse 旧 tokenizer | 1 | math |
| mdast transformer | 6 | slug, code, toc, figure, metadata, document |
| to-hast handler | 6 slot | math (inline / display), code, figure (paragraph 経由), table, footnote 3 種 |
| hast transformer | 6 | figure, replace, document, math, format, rewrite-extension |
| ラッパ / スキーマのみ | 5 | attr, line-breaks, options, table, footnotes |

- `math.ts` は tokenizer / handler / hast transformer の 3 役を兼ねる。
- `figure.ts` は mdast transformer / handler / hast transformer の 3 役を兼ねる。
- `document.ts` は `mdast` を export しているが、hast 段で動く。

#### プロセッサ構成

- メイン プロセッサ (`packages/vfm/src/index.ts`, `VFM()`): `remarkParse` → mdast 11 slot (`revive-parse.ts`) → handlers 付き `remarkRehype` → hast 8 slot (`revive-rehype.ts`) → `rehypeStringify`。
- 2 本目 (`packages/vfm/src/plugins/metadata.ts`, `readMetadata()`): footnotes, attr, frontmatter を使う独立した unified プロセッサ。
- `editPlugins` フックが 3 配列 (`mdastPlugins`, `mdastToHastHandlers`, `hastPlugins`) を公開 API として露出する。各 slot には `brand<T>()` のブランド型が付く。

mdast slot の順序: parseImageAltAsInline, lineBreaks, math, ruby, footnote, attr, slug, section, code, toc, frontmatter。

hast slot の順序: raw, deriveImgAltFromFigcaption, footnote, replace, rewriteRelativeHrefExtensions, document, math, format。

#### hast 段の順序制約

- `deriveImgAltFromFigcaption` は `rehype-raw` の後に動く必要がある (展開後の `<figcaption>` を読む)。
- `math` (MathJax script 注入) は `document` の後に動く必要がある (`<head>` に書く)。

### サブパッケージと外部プラグイン ([#278](https://github.com/vivliostyle/vfm/issues/278))

各 footnote パッケージが依存する上流の出力まで含めたパッケージ単位の調査は [remark13-subpackages.md](./remark13-subpackages.md) にある。

#### サブパッケージ

| パッケージ | 関与 | 影響 |
| --- | --- | --- |
| remark-ruby | 旧 tokenizer + handler | 大 (再実装) |
| remark-footnote-dpub / gcpm | handler + hast | 中 |
| remark-footnote-pandoc | hast のみ | 中 (前提となる endnote 出力構造が変わる) |
| remark-sectionize | mdast transformer | 小 (型のみ) |
| mdast-to-hast-table-cell | handler | 中 (deep import あり) |
| rehype-rewrite-extension | hast のみ | 小 |
| vfm-internal-utils | hastscript のみ | 小 |

`remark-ruby` は `remark-parse` の型を `devDependencies` からしか参照しておらず、公開している `.d.ts` が devDependency に依存している。

#### 外部プラグイン

| プラグイン | 現行 | 状況 |
| --- | --- | --- |
| remark-attr | 0.11 | 更新停止。自作が必要 ([#46](https://github.com/vivliostyle/vfm/issues/46), [#211](https://github.com/vivliostyle/vfm/issues/211))。先行試作: `origin/remark-attribute` ブランチ (remark-parse 11 向け属性拡張) |
| remark-shortcodes | 0.3 | 更新停止。存廃は [#207](https://github.com/vivliostyle/vfm/issues/207) で判断 |
| remark-footnotes | 2 | deprecated。remark-gfm に統合されたが inline note `^[...]` は非対応 |
| remark-breaks | 1 | 4 系で対応済み |
| remark-frontmatter | 2 | 5 系で対応済み |
| remark-math | – | 6 系が利用可能 ([#224](https://github.com/vivliostyle/vfm/issues/224) の候補) |

### 主要な破壊点 ([#279](https://github.com/vivliostyle/vfm/issues/279))

remark 13 へ移行すると必ず壊れる箇所。各 Phase の Issue はこの一覧を参照する。各項目の詳細 (場所、原因、remark 13 での対応物、修正、Phase、検証方法) と、Phase 0-1 / 0-2 で追加で見つかった 9 件は [remark13-breaking-points.md](./remark13-breaking-points.md) にある。

1. **旧 tokenizer 拡張**: `this.Parser.prototype.inlineTokenizers` / `inlineMethods` への追加 (`packages/vfm/src/plugins/math.ts`, `packages/remark-ruby/src/ruby.ts`)。remark 13 では無言で無効になる。micromark extension へ書き直す。
2. **to-hast handler の署名**: `(h, node)` と `all(h, node)` / `one(h, ...)` が `(state, node, parent)` と `state.all()` / `state.one()` に変わる。全 handler と `buildFigure` / `buildDisplayMath` / `withTableCellTransform` / footnote 3 パッケージが対象。
3. **unified の import 形式**: `import unified from 'unified'` と `unified.Plugin` / `unified.Pluggable` などの名前空間型が使えない。`utils.ts` の `brand` / `mergePlugins` / `partial` もこれに乗っている。
4. **remark-parse のオプション**: `{ gfm: true, commonmark: true }` は廃止。GFM は remark-gfm で有効化する。
5. **deep import**: `mdast-util-to-hast/lib/handlers/table.js` (`packages/vfm/src/revive-rehype.ts`, `packages/mdast-to-hast-table-cell/tests`) は 13 の `exports` で閉じられる。
6. **alt の再パース**: `packages/vfm/src/plugins/figure.ts` の `this.parse(image.alt)` は remark-parse 8 固有の挙動に依存 (同ファイルの `TODO` コメント参照)。
7. **旧 Parser 内部のテスト**: `packages/vfm/tests/defs.test.ts` (6 件) は `vfm.Parser.prototype.inlineMethods` などを検証しており成立しない。
8. **`@types/mdast` 4 の型名**: `StaticPhrasingContentMap` → `PhrasingContentMap`、`Content` / `HTML` の廃止など。module augmentation は `packages/vfm/src/plugins/{code,math,toc}.ts`、`packages/vfm/types/remark.d.ts`、`packages/remark-ruby/src/ruby.ts`、`packages/remark-sectionize/src/section.ts`、`packages/mdast-to-hast-table-cell/tests/rehype-format.d.ts` に分散している。
9. **MDAST 期待値**: テストは `unist-util-inspect` のダンプ文字列を比較しており、ノード構造の変化で大半が書き直しになる。

## 参考

- 先行試作: `origin/remark-attribute` ブランチ (remark-parse 11 向け属性拡張)
- [#45](https://github.com/vivliostyle/vfm/issues/45): remark-frontmatter, remark-directive, remark-footnotes の移行例
- [#192](https://github.com/vivliostyle/vfm/issues/192): 段階対応案 (Node 22、ESM 化、unified 更新、remark 更新)。前半 2 段階は完了済み
