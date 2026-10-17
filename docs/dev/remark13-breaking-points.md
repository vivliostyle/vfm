# remark 13 Migration: Breaking Points

Places that are guaranteed to break when VFM moves to remark 13 (Phase 0-3, [#279](https://github.com/vivliostyle/vfm/issues/279)). Each entry names the affected code, why it breaks, the remark 13 counterpart, the fix, the phase that owns it, and how to verify. The first nine entries are the list from #279; the rest were found while writing the [`packages/vfm` inventory](./remark13-vfm-inventory.md) and the [sub-package survey](./remark13-subpackages.md). Upstream behavior was checked against the packages in the pnpm store (`unified` 11.0.5, `remark-parse` 11.0.0, `mdast-util-to-hast` 13.2.1, `hastscript` 9.0.1, `hast-util-raw` 9.1.0, `refractor` 5.0.0) on 2026-10-17.

Phases refer to the sub-issues of [#275](https://github.com/vivliostyle/vfm/issues/275): Phase 2 [#281](https://github.com/vivliostyle/vfm/issues/281) (base libraries), Phase 3 [#285](https://github.com/vivliostyle/vfm/issues/285) (syntax plugins on micromark), Phase 4 [#293](https://github.com/vivliostyle/vfm/issues/293) (verification and tests).

## Summary

| # | Breaking point | Kind | Phase |
| --- | --- | --- | --- |
| 1 | Legacy tokenizer extensions | Silent no-op | 3 |
| 2 | to-hast handler signature | Runtime error | 2 |
| 3 | unified import style | Compile error | 2 |
| 4 | remark-parse options | Silent no-op | 2 |
| 5 | Deep imports | Resolution error | 2 |
| 6 | Re-parsing `Image.alt` | Wrong output | 3 |
| 7 | Tests of parser internals | Test failure | 4 |
| 8 | `@types/mdast` 4 type names | Compile error | 2 |
| 9 | MDAST expectations in tests | Test failure | 4 |
| 10 | hastscript 9 child / properties detection | Wrong output | 2 |
| 11 | `footnoteById` is a `Map` | Runtime error | 2 |
| 12 | `mdast-util-to-hast` 13 endnote footer | Wrong output | 2 |
| 13 | `refractor` 5 returns a `Root` | Wrong output | 2 |
| 14 | `hast-util-raw` 9 signature | Compile error | 2 |
| 15 | Inline footnote node disappears | Silent no-op | 3 |
| 16 | `findAndReplace` fallback in `math.ts` | Wrong output | 3 |
| 17 | Legacy external plugins | Silent no-op | 3 |
| 18 | Sub-package test utilities | Test failure | 4 |

"Silent no-op" entries are the dangerous ones: the build and the processor run, and only the HTML output shows that a syntax was not parsed.

## From #279

### 1. Legacy tokenizer extensions

- **Where.** `packages/vfm/src/plugins/math.ts` (`mdast`), `packages/remark-ruby/src/ruby.ts` (`mdast`).
- **Why.** Both attach tokenizers to `this.Parser.prototype.inlineTokenizers` / `inlineMethods`. remark-parse 10+ sets `this.parser` (lowercase) to a `mdast-util-from-markdown` wrapper and unified 11 no longer has `Parser`, so `this.Parser` is `undefined`. Both plugins guard on it (`if (!this.Parser) return`) and therefore do nothing. The `$...$` and `{base|ruby}` syntaxes come out as plain text.
- **Counterpart.** micromark syntax extensions registered through `this.data('micromarkExtensions')` plus `mdast-util-from-markdown` extensions through `this.data('fromMarkdownExtensions')`. remark-parse 11 reads both lists.
- **Fix.** Rewrite both as micromark + from-markdown extensions. For math, remark-math 6 is the candidate ([#224](https://github.com/vivliostyle/vfm/issues/224)); its node names (`inlineMath` / `math`) and field (`value`) differ from VFM's (`inlineMath` / `displayMath`, `data.value`), so either the handlers change or a VFM extension keeps the old shape. Ruby needs an inline extension whose base text is tokenized by micromark so that nested inline syntax keeps working.
- **Verify.** `tests/math.test.ts`, `tests/math-mathml.test.ts`, `packages/remark-ruby/tests/ruby.test.ts`. Add a test that fails if the syntax is silently unparsed (for example, assert that no literal `$` survives in the output of a math test).

### 2. to-hast handler signature

- **Where.** Every handler: `math.ts` (`handlerInlineMath`, `handlerDisplayMath`), `code.ts` (`handler`), `revive-rehype.ts` (`paragraph`), `figure.ts` (`buildFigure`), `math.ts` (`buildDisplayMath`, takes a node only), `remark-ruby` (`handler`), `mdast-to-hast-table-cell` (`withTableCellTransform`, `TableCellHook`), `remark-footnote-dpub` / `gcpm` (three handlers each).
- **Why.** `mdast-util-to-hast` 13 calls handlers as `(state, node, parent)`. `h(node, tagName, props, children)` no longer exists; `all` and `one` are not exported.
- **Counterpart.** `state.all(node)`, `state.one(node, parent)`, `state.patch(node, element)` (copies position), `state.applyData(node, element)` (applies `hName` / `hProperties` / `hChildren`). Elements are built as plain objects or with hastscript.
- **Fix.** Convert each handler. The public `TableCellHook` type of `mdast-to-hast-table-cell`, which receives `{ h }`, becomes `{ state }` or a narrowed subset.
- **Verify.** HTML expectations of every handler test; `tests/edit-plugins.test.ts` for handler replacement through `editPlugins`.

### 3. unified import style

- **Where.** `packages/vfm/src/index.ts`, `utils.ts`, `revive-parse.ts`, `revive-rehype.ts`, `plugins/metadata.ts`, `plugins/figure.ts`, `plugins/footnotes.ts`, `plugins/math.ts`; `remark-footnote-{dpub,gcpm,pandoc}`; every test utility.
- **Why.** unified 10+ exports `{ unified }` and named types (`Plugin`, `Pluggable`, `PluggableList`, `Processor`, `Transformer`). `import unified from 'unified'` and `unified.Plugin` fail to compile.
- **Counterpart.** `import { unified, type Plugin, type Pluggable } from 'unified'`. `Plugin` is generic over parameters and tree types.
- **Fix.** Mechanical replacement. `brand<T>()`, `mergePlugins`, and `partial` in `utils.ts` keep their shape with the named types. The `unified.PluggableList<unified.Settings>` cast in `metadata.ts` is dropped.
- **Verify.** `tsc` across the workspace.

### 4. remark-parse options

- **Where.** `packages/vfm/src/index.ts` (`VFM()`), `plugins/metadata.ts` (`parseMarkdown`), and every sub-package test utility: `[remarkParse, { gfm: true, commonmark: true }]`.
- **Why.** remark-parse 11 forwards its options to `mdast-util-from-markdown`, which has no `gfm` or `commonmark` option. CommonMark is the only mode. The call type-checks only against the old types and does nothing at runtime, so GFM tables, strikethrough, autolink literals, and footnote references are not parsed until remark-gfm is added.
- **Counterpart.** `remark-gfm` 4 as an mdast slot, before any plugin that reads GFM nodes.
- **Fix.** Replace the options with `remarkGfm` in the slot list. `.data('settings', { position })` is also forwarded to `fromMarkdown` and ignored; positions are always present.
- **Verify.** `tests/table.test.ts`, `tests/footnotes.test.ts`, and the MDAST dumps of any test with GFM syntax.

### 5. Deep imports

- **Where.** `packages/vfm/src/revive-rehype.ts`, `packages/mdast-to-hast-table-cell/tests/{utils,composition.test}.ts`: `mdast-util-to-hast/lib/handlers/table.js`.
- **Why.** `mdast-util-to-hast` 13 has `"exports": "./index.js"`; any `lib/` path fails to resolve.
- **Counterpart.** `import { defaultHandlers } from 'mdast-util-to-hast'` and `defaultHandlers.table`.
- **Fix.** Replace the import. Also decide whether VFM's own packages add an `exports` field; the README's `@vivliostyle/vfm/lib/revive-parse` deep import depends on there being none.
- **Verify.** Build and `packages/mdast-to-hast-table-cell/tests`.

### 6. Re-parsing `Image.alt`

- **Where.** `packages/vfm/src/plugins/figure.ts` (`parseImageAltAsInline`): `this.parse(image.alt)`.
- **Why.** remark-parse 8 stored the raw source of the alt text, so `![**bold** caption](a.png)` kept the asterisks in `alt` and the plugin could re-parse them. micromark decodes `alt` to plain text (`bold caption`) before any plugin runs, so there is nothing left to re-parse. `this.parse` itself still exists on the unified processor.
- **Counterpart.** The raw caption is only available during tokenization. A from-markdown extension can record the source slice of the image label (for example as `data.rawAlt`) or keep the label's child tokens.
- **Fix.** Replace the re-parse with a VFM extension that keeps the inline children of the image label, and have `buildFigure` read them. The non-standard `Image.children` convention should become a typed field.
- **Verify.** `tests/figure.test.ts`, in particular the `parseFigcaptionAsInline` cases and alt derivation (`deriveImgAltFromFigcaption`).

### 7. Tests of parser internals

- **Where.** `packages/vfm/tests/defs.test.ts` (6 tests): `vfm.Parser.prototype.inlineMethods`, `blockMethods`, `interruptParagraph`, `interruptList`, `interruptBlockquote`, `interruptFootnoteDefinition`.
- **Why.** None of these exist in remark-parse 11.
- **Counterpart.** The lists `this.data('micromarkExtensions')` and `this.data('fromMarkdownExtensions')` on a frozen processor.
- **Fix.** Replace with tests that assert the registered extensions (count or identity), or delete the file and rely on behavior tests.
- **Verify.** The replacement tests themselves.

### 8. `@types/mdast` 4 type names

- **Where.** `packages/vfm/src/plugins/math.ts` (`StaticPhrasingContentMap`), `toc.ts` (`Content`, `BlockContentMap`), `code.ts` (`unist` `Data` augmentation), `types/remark.d.ts`, `packages/remark-ruby/src/ruby.ts` (`unist` `Data`), `packages/remark-sectionize/src/section.ts` (`Content`, `HTML`, `BlockContentMap`, `unist` `Data`), `packages/mdast-to-hast-table-cell/tests/rehype-format.d.ts`.
- **Why.** `@types/mdast` 4 renames `StaticPhrasingContentMap` to `PhrasingContentMap`, `Content` to `RootContent`, `HTML` to `Html`, and drops the `Content` union. `@types/unist` 3 `Data` is augmented by `mdast-util-to-hast` 13 itself (`hName`, `hProperties`, `hChildren`), so the local augmentations duplicate it.
- **Counterpart.** `PhrasingContentMap`, `BlockContentMap` (unchanged), `RootContent`, `Html`; `import 'mdast-util-to-hast'` for the `Data` fields.
- **Fix.** Rename, remove the duplicated `Data` augmentations (keep `figcaptionTitle` in `code.ts` and `rubyText` in ruby), delete `rehype-format.d.ts` once `rehype-format` 5 ships types.
- **Verify.** `tsc`.

### 9. MDAST expectations in tests

- **Where.** Every `packages/vfm/tests/*.test.ts` that uses `buildProcessorTestingCode` (`tests/utils.ts`): the MDAST is compared as a `unist-util-inspect` dump with positions and `data:` lines stripped.
- **Why.** Node shapes change: `inlineMath` / `math` from remark-math, remark-gfm footnote nodes, attribute carrier nodes from the attr rewrite, ruby and inline note nodes. `unist-util-inspect` 8 may also format differently.
- **Fix.** Regenerate the expected dumps after each syntax lands and review the diff by hand; keep the HTML expectation as the behavioral check.
- **Verify.** The tests themselves. Expect the largest churn in `figure.test.ts`, `math.test.ts`, `footnotes.test.ts`, and `code.test.ts`.

## Found in Phase 0-1 and 0-2

### 10. hastscript 9 child / properties detection

- **Where.** `packages/vfm/src/plugins/document.ts` (`h('head', ...createHead())`, `h('html', props, [u('text', '\n'), ...])` is fine), `packages/remark-footnote-dpub/src/index.ts` (`h('sup', u('text', '1'))`), and any user-supplied `ElementFactory` passed to `buildElement`.
- **Why.** hastscript 9 decides whether the second argument is properties with an `isChild` check: an object is a child only if it has an object-valued field (other than an array of strings / numbers) or a `children` array. A text node `{ type: 'text', value: '\n' }` has neither, so it is treated as properties and rendered as `type="text" value="..."` attributes with no text child.
- **Counterpart.** Pass children as one array or after an explicit properties object: `h('sup', {}, u('text', '1'))`.
- **Fix.** Audit every `h()` call whose second argument can be a text node. hastscript 7 accepted them.
- **Verify.** `tests/index.test.ts` (document wrapper, `<head>` contents), `packages/remark-footnote-dpub/tests`.

### 11. `footnoteById` is a `Map`

- **Where.** `packages/remark-footnote-dpub/src/index.ts`, `packages/remark-footnote-gcpm/src/index.ts`: `identifier in ctx.footnoteById`, `ctx.footnoteById[id]`, `ctx.footnoteById[identifier] = ...`.
- **Why.** `mdast-util-to-hast` 13 `state.footnoteById` is a `Map<string, FootnoteDefinition>` keyed by `String(identifier).toUpperCase()`. The `in` check and index access return `false` / `undefined`, and assignment adds an own property that `state` never reads.
- **Counterpart.** `state.footnoteById.has(id)`, `.get(id)`, `.set(id, def)`. `state.footnoteOrder` and `state.footnoteCounts` track numbering and duplicates.
- **Fix.** Convert the accesses. Consider using `footnoteOrder` / `footnoteCounts` instead of the packages' own counters.
- **Verify.** `packages/remark-footnote-{dpub,gcpm}/tests`, `tests/footnotes.test.ts`.

### 12. `mdast-util-to-hast` 13 endnote footer

- **Where.** `packages/remark-footnote-pandoc/src/index.ts`: selectors `div.footnotes`, `li[id^="fn-"]`, `sup[id^="fnref-"]:has(a:only-child[href^="#fn-"].footnote-ref)`, `a.footnote-backref`.
- **Why.** The v13 footer is `<section data-footnotes class="footnotes">` with an `<h2 id="footnote-label" class="sr-only">`, `<li id="user-content-fn-id">`, calls `<sup><a href="#user-content-fn-id" id="user-content-fnref-id" data-footnote-ref aria-describedby="footnote-label">`, and backlinks `<a href="#user-content-fnref-id" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference N">`. None of the current selectors match, so the transformer leaves the default footer untouched.
- **Counterpart.** `remark-rehype` 11 options `clobberPrefix`, `footnoteLabel`, `footnoteLabelTagName`, `footnoteLabelProperties`, `footnoteBackLabel`, `footnoteBackContent`; or custom `footnoteReference` / `footnoteDefinition` handlers plus a footer built from `state.footnoteOrder`.
- **Fix.** Either rewrite the selectors against the v13 footer, or emit the Pandoc structure directly from handlers (preferred; see the sub-package survey).
- **Verify.** `packages/remark-footnote-pandoc/tests`, `tests/footnotes.test.ts`.

### 13. `refractor` 5 returns a `Root`

- **Where.** `packages/vfm/src/plugins/code.ts` (`mdast`): `node.data.hChildren = refractor.highlight(value, lang)`.
- **Why.** refractor 3 returned an array of hast nodes. refractor 4+ returns `{ type: 'root', children }`. Assigning the root to `hChildren` nests a `root` inside `<code>`, which `rehype-stringify` renders as its children in practice but which breaks `hChildren` typing and any hast consumer that expects element content.
- **Counterpart.** `refractor.highlight(value, lang).children`.
- **Fix.** Take `.children`. refractor 5 also drops the default export in favor of `import { refractor } from 'refractor'`, and language registration moves to `refractor/<lang>` paths.
- **Verify.** `tests/code.test.ts` highlighting cases.

### 14. `hast-util-raw` 9 signature

- **Where.** `packages/vfm/src/plugins/figure.ts` (`parseHtml`): `raw(u('root', [u('raw', value)]))`.
- **Why.** `hast-util-raw` 9 is `raw(tree, options)` with a named export and returns `Nodes`; the default export is gone, and the `raw` node type must be declared through `mdast-util-to-hast`'s augmentation.
- **Counterpart.** `import { raw } from 'hast-util-raw'`; `raw(tree)` still accepts a root with a `raw` child.
- **Fix.** Update the import and the return type cast.
- **Verify.** `tests/figure.test.ts` cases with HTML comments inside the image paragraph.

### 15. Inline footnote node disappears

- **Where.** `packages/vfm/src/plugins/slug.ts` and `plugins/metadata.ts` (`child.type !== 'footnote'` filters), `footnotes.ts` (`inlineNotes: true`), the `footnote` handlers of `remark-footnote-dpub` / `gcpm`, `tests/footnotes.test.ts`.
- **Why.** `remark-footnotes` 2 produced a `footnote` node for `^[text]`. remark-gfm 4 has no inline notes, so the node type never appears and `^[text]` is rendered as literal text. The filters and handlers become dead code without any error.
- **Counterpart.** None upstream. A VFM micromark extension must define the syntax and the node.
- **Fix.** Write the inline-note extension first (it is the shared dependency of slug, metadata, and the footnote packages) and update the node type name if it changes.
- **Verify.** `tests/footnotes.test.ts` inline cases, `tests/metadata.test.ts` title extraction with footnotes.

### 16. `findAndReplace` fallback in `math.ts`

- **Where.** `packages/vfm/src/plugins/math.ts` (`mdast`), the branch taken when `this.Parser` is absent.
- **Why.** The fallback was written for "remark 13 or later" but runs after parsing, on `text` nodes. `$**x**$` is already `text('$'), strong, text('$')`, so the regex never sees the whole formula, and `$` inside code spans or links is matched where the tokenizer excluded it (`notInLink`). In remark 13 this branch is the one that runs (see #1), so math output is wrong rather than missing.
- **Fix.** Delete the fallback together with the tokenizer and move to a micromark extension.
- **Verify.** `tests/math.test.ts` cases with inline markup inside formulas and `$` inside code.

### 17. Legacy external plugins

- **Where.** `remark-attr` 0.11 (`attr.ts`, `remark-sectionize` tests), `remark-shortcodes` 0.3 (`toc.ts`), `remark-footnotes` 2 (`footnotes.ts`, footnote package tests), `remark-breaks` 1 (`line-breaks.ts`, `remark-ruby` tests).
- **Why.** All four patch `this.Parser.prototype`. With `this.Parser` undefined they return early, so attributes, `[[toc]]`, footnotes, and hard breaks stop working without an error. `code.ts` also carries a workaround for remark-attr parsing code content as attributes when `meta` is empty; it becomes dead code.
- **Counterpart.** `remark-breaks` 4 (transformer, drop-in), `remark-gfm` 4 (footnote references and definitions), VFM extensions for attributes and inline notes, `remark-directive` 4 or a block extension for `[[toc]]` if kept ([#207](https://github.com/vivliostyle/vfm/issues/207)).
- **Fix.** Per plugin, see the sub-package survey. Remove the remark-attr workaround from `code.ts`.
- **Verify.** `tests/attr.test.ts`, `tests/code.test.ts`, `tests/line-breaks.test.ts`, `tests/metadata.test.ts` (`[[toc]]` detection), `packages/remark-sectionize/tests` (`{hidden}`).

### 18. Sub-package test utilities

- **Where.** `packages/remark-ruby/tests/ruby.test.ts`, `packages/remark-footnote-{dpub,gcpm,pandoc}/tests/*.test.ts`, `packages/remark-sectionize/tests/utils.ts`, `packages/mdast-to-hast-table-cell/tests/utils.ts`.
- **Why.** Each builds its own processor with `import unified from 'unified'`, `remark-parse` 8 options, and `remark-footnotes` / `remark-attr` / `remark-breaks` 1 from `devDependencies`. They hit #1, #3, #4, #5, and #17 at once.
- **Fix.** Port each utility together with its package: `{ unified }`, remark-gfm, remark-breaks 4, the VFM inline-note and attribute extensions once they exist, `defaultHandlers.table`.
- **Verify.** `pnpm test` per package.

## Dependencies between fixes

- #15 (inline note node) and #17 (attribute extension) are inputs to #1, #6, #9, #11, #12, and #18. Define those two node shapes before porting handlers or tests.
- #2 and #11 are done together per footnote package.
- #4 (remark-gfm) must land before any footnote or table test can pass.
- #10, #13, and #14 are independent library adaptations and can be done first in Phase 2.
