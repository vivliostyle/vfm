# remark 13 Migration: Sub-packages and External Plugins

Survey of the sub-packages under `packages/` and the external remark / rehype plugins VFM depends on, for the remark 13 migration (Phase 0-2, [#278](https://github.com/vivliostyle/vfm/issues/278)). It expands the summary in [remark13-migration.md](./remark13-migration.md) and complements the [`packages/vfm` inventory](./remark13-vfm-inventory.md). Surveyed against `main` as of 2026-10-17; upstream behavior was checked against the packages already present in the pnpm store (`mdast-util-to-hast` 13.2.1, `hastscript` 9.0.1, `remark-rehype` 11.1.2).

Change class follows the inventory: **Rewrite** (mechanism gone), **Adapt** (same mechanism, new API), **Keep** (type bumps only).

## Sub-packages

| Package | Version | Stage | Impact | Change |
| --- | --- | --- | --- | --- |
| `@vivliostyle/remark-ruby` | 1.0.1 | legacy tokenizer + handler | Large | Rewrite |
| `@vivliostyle/remark-footnote-dpub` | 1.0.1 | handler ×3 + hast | Medium | Adapt (handlers), Rewrite (inline note source) |
| `@vivliostyle/remark-footnote-gcpm` | 1.0.1 | handler ×2 | Medium | Adapt (handlers), Rewrite (inline note source) |
| `@vivliostyle/remark-footnote-pandoc` | 1.0.1 | hast only | Medium | Rewrite (selectors follow upstream output) |
| `@vivliostyle/remark-sectionize` | 1.0.1 | mdast transformer | Small | Adapt (types, utility majors) |
| `@vivliostyle/mdast-to-hast-table-cell` | 0.0.0 | handler wrapper | Medium | Adapt (handler signature, deep import) |
| `@vivliostyle/rehype-rewrite-extension` | 0.0.0 | hast only | Small | Keep |
| `@vivliostyle/vfm-internal-utils` | 1.0.1 | hastscript helper | Small | Keep |

Shared traits:

- No package has an `exports` field. Every package publishes `lib/` with `main` / `types` pointing at the compiled entry.
- Every package that touches `mdast-util-to-hast` depends on 11.3 directly while `remark-rehype` 8 pulls 10.2. The handler signature and `footnoteById` shape come from 11, the endnote footer output from 10.
- Every test suite builds its own processor with `remark-parse` 8 options (`{ gfm: true, commonmark: true }`), `remark-footnotes`, or `remark-attr` from `devDependencies`. All test utilities need the same rewrite as `packages/vfm/src/index.ts`.
- The following are shared and move together:
  - `hast-util-select` 5
  - `unist-builder` 3
  - `unist-util-visit` 4
  - `hastscript` 7
  - `@types/{hast,mdast,unist}` 2/3/2

### `remark-ruby`

Source: `packages/remark-ruby/src/ruby.ts`.

- **Parser**
  - An inline tokenizer for `{base|ruby}` registered on `this.Parser.prototype.inlineTokenizers` / `inlineMethods` before `text`. It calls `this.tokenizeInline(inlineContent, now)` to parse the base text recursively, so ruby can contain emphasis, code, and other inline syntax. remark 13 ignores the registration silently.
- **Types**
  - `Eat`, `Parser`, and `Tokenizer` are imported from `remark-parse`, which is only a `devDependency`, so the published `.d.ts` cannot be consumed without it.
  - The local `Tokenizer` type patches gaps in the remark-parse 8 typings:
    - `this.tokenizeInline`
    - `eat.now()`
    - non-optional `Point.offset`
  - Augments `unist` `Data` with `hName`.
- **Handler**
  - `(h, node)` returns `h(node, 'ruby', [...all(h, node), rt])`. The `rt` text is carried in `data.rubyText`.
- **Change**
  - Rewrite the parser as a micromark extension plus an `mdast-util-from-markdown` extension (`enter` / `exit` handlers that build a `ruby` node with `children` and `rubyText`). The nested inline parse is the hard part: the extension has to tokenize `{` … `|` as an inline container so that the base text is parsed by micromark, not re-parsed from a string.
  - Handler becomes `(state, node)` with `state.all(node)` and `state.patch` / `state.applyData`.
  - Drop the `remark-parse` type import and the `Data` augmentation.
- **Tests**
  - `tests/ruby.test.ts` builds `remark-parse` 8 + `remark-breaks` 1 + `remark-rehype` 8 and registers the handler; expectations are HTML strings, so they can survive if the output is reproduced.

### `remark-footnote-dpub` and `remark-footnote-gcpm`

Source: `packages/remark-footnote-dpub/src/index.ts`, `packages/remark-footnote-gcpm/src/index.ts`.

Both packages override the `footnoteReference` and `footnote` handlers (dpub also `footnoteDefinition`) and use `@vivliostyle/vfm-internal-utils` `buildElement` for the customizable elements.

- **Handler state**
  - Handlers are `(ctx, node)` and read `ctx.footnoteById` as a plain object:
    - `identifier in ctx.footnoteById`
    - `ctx.footnoteById[id]`
    - assignment for inline notes
  - In `mdast-util-to-hast` 13 `state.footnoteById` is a `Map` keyed by `String(identifier).toUpperCase()` (same normalization as today), so every access becomes `has` / `get` / `set`. `all(ctx, node)` becomes `state.all(node)`.
- **Inline notes**
  - The `footnote` handler consumes the inline note node (`^[...]`) that `remark-footnotes` produces and synthesizes a `footnoteDefinition` on the fly. remark-gfm 4 has no inline notes, so this handler has no input until a VFM inline-note extension exists. The node type and shape are VFM's to define; the handlers should be written against that definition.
- **Numbering**
  - Both packages assign `refIndex` at handler-invocation time and dpub renumbers in a final hast pass because `mdast-util-to-hast` < 12.1.1 walked table cells in reverse ([#129](https://github.com/vivliostyle/vfm/issues/129)). With v13 the walk order is document order, so the renumber pass becomes an identity transform and can stay as a safety net or be removed. The default handler in v13 also tracks duplicates itself (`state.footnoteCounts`, `-2` suffix), which the custom handlers do not use.
- **hastscript**
  - dpub builds `h('sup', u('text', '1'))`. hastscript 9 treats a plain text node passed in the properties position as properties (its `isChild` check returns false for an object whose only values are strings), so the `<sup>` would get `type` / `value` attributes and no text. Pass children as an array or build the text node explicitly. Calls with an explicit properties object (`h('a', {...}, child)`) are unaffected.
- **dpub transformer**
  - `createReplaceDpubPlaceholders` is a hast transformer that replaces `<div data-footnote-placeholder>` with the queued `<aside>` and inserts inline-note asides after the nearest non-flow-container ancestor. It depends only on hast and `hast-util-select`, so it adapts with the utility majors.
- **gcpm**
  - `hastTransformer` is a no-op; all work is in the handlers. `hastTransformer: unified.Plugin` uses the namespace type.
- **Change**
  - Adapt handlers to `(state, node)` with the `Map` API.
  - Follow the inline note node definition.
  - Fix the `h('sup', textNode)` calls.
  - Replace `unified.Plugin` with the named `Plugin` type.
- **Tests**
  - `tests/dpub.test.ts` and `tests/gcpm.test.ts` build processors with `remark-footnotes` and compare HTML. Inline-note cases need the new extension; the rest should hold.

### `remark-footnote-pandoc`

Source: `packages/remark-footnote-pandoc/src/index.ts`.

- **Mechanism**
  - No handlers (`toHastHandlers` are all `undefined`). Two hast transformers rewrite the endnote markup that `mdast-util-to-hast` 10 emits into a Pandoc-like `<section role="doc-endnotes">`, renumber calls by document order, and add backlinks for duplicate references.
- **Coupling**
  - Every selector is pinned to the v10 footer:
    - `div.footnotes`
    - `li[id^="fn-"]`
    - `sup[id^="fnref-"]:has(a:only-child[href^="#fn-"].footnote-ref)`
    - `a.footnote-backref`
  - The v13 footer is different in every respect that the selectors touch:

    | | `mdast-util-to-hast` 10 | `mdast-util-to-hast` 13 |
    | --- | --- | --- |
    | Area | `<div class="footnotes">` | `<section data-footnotes class="footnotes">` with an `<h2 id="footnote-label" class="sr-only">Footnotes</h2>` |
    | Element | `<li id="fn-ID">` | `<li id="user-content-fn-id">` |
    | Call | `<sup id="fnref-ID"><a href="#fn-ID" class="footnote-ref">` | `<sup><a href="#user-content-fn-id" id="user-content-fnref-id" data-footnote-ref aria-describedby="footnote-label">` |
    | Backlink | `<a href="#fnref-ID" class="footnote-backref">` | `<a href="#user-content-fnref-id" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference N">` |
    | Duplicates | Not handled | `-2`, `-3` suffixes on call ids and extra backlinks |

  - `remark-rehype` 11 exposes options that remove the `user-content-` prefix and the label heading, and shape the backlink content:
    - `clobberPrefix`
    - `footnoteLabel`
    - `footnoteLabelTagName`
    - `footnoteLabelProperties`
    - `footnoteBackLabel`
    - `footnoteBackContent`
- **Change**
  - Rewrite the selectors and the call / backlink rewriting against the v13 footer, or (preferred) stop post-processing the default footer and emit the Pandoc structure from custom `footnoteReference` / `footnoteDefinition` handlers plus a footer built from `state.footnoteOrder`, which also makes the package independent of upstream markup changes.
  - The duplicate-reference and renumber logic can be simplified because v13 handles both in document order.
  - Replace the local `mergePlugins` copy and `unified.Plugin` with named types.
- **Tests**
  - `tests/pandoc.test.ts` compares HTML after the full pipeline. All expectations depend on the chosen output and the `clobberPrefix` decision.

### `remark-sectionize`

Source: `packages/remark-sectionize/src/section.ts`.

- **Mechanism**
  - mdast transformer. Visits headings from depth 6 to 1 and wraps each heading and its following siblings in a `section` node with `data.hName` / `data.hProperties`. Reads the original heading line from the source via `position` offsets to detect closing hashes (`## Title ##` opts out of sectioning) and end marks (`##` alone closes a section).
- **Coupling**
  - `Content` and `HTML` from `@types/mdast` 3 (`RootContent` and `Html` in 4)
  - `unist-util-find-after` 4 and `unist-util-visit-parents` 5 (5 and 6 now)
  - `vfile` 4 `file.toString()` (still works in 6)
  - `heading.data.hProperties.hidden`, which `remark-attr` sets from `{hidden}`, so it follows the attr rewrite
  - Augments `BlockContentMap` and `unist` `Data`.
  - A leftover `node.type === 'export'` check is from MDX-era remark and matches nothing.
- **Change**
  - Adapt types and utility majors. Verify in Phase 4 that micromark gives the same `position` for headings with closing sequences and for bare `##` lines, because the opt-out and end-mark detection read the source text, not the AST.
- **Tests**
  - `tests/utils.ts` uses `remark-attr` for `{hidden}` and `remark-parse` 8 options; `rehype-format` and `remark-attr` are imported with `@ts-expect-error`.

### `mdast-to-hast-table-cell`

Source: `packages/mdast-to-hast-table-cell/src/index.ts`.

- **Mechanism**
  - `withTableCellTransform(hook)(handler)` wraps a `table` handler, runs it, collects every `th` / `td` in the result, and replaces each cell with the hook's output. Hooks receive `{ h }` and a cell context (`node`, `tagName`, `align`, `properties`, `children`). The three presets move the `align` attribute to an attribute, a class, or an inline style.
- **Coupling**
  - `H` and `Handler` types from `mdast-util-to-hast` 11; the wrapper and hooks are `(h, node, parent)`.
  - Reads `cell.properties.align`, which the v13 `tableRow` handler still sets, so the cell detection holds.
  - Tests deep-import `mdast-util-to-hast/lib/handlers/table.js`, which v13 closes with `exports`; v13 exports `defaultHandlers.table` from the root.
  - `hast-util-get-attribute` 1 and `hast-util-get-class-list` 1 have no newer major.
- **Change**
  - Adapt the wrapper to `(state, node, parent)` and pass `state` (or a narrowed subset) to hooks instead of `h`. This changes the public `TableCellHook` type.
  - Replace the deep import in tests with `defaultHandlers.table`.
  - Remove `tests/rehype-format.d.ts` once `rehype-format` 5 ships types.
- **Tests**
  - `tests/table.test.ts` and `tests/composition.test.ts` compare HTML through `remark-parse` 8 + `remark-rehype` 8; GFM tables come from remark-gfm in 13.

### `rehype-rewrite-extension`

Source: `packages/rehype-rewrite-extension/src/index.ts`.

- **Mechanism**
  - hast transformer. For each rule, selects elements with `hast-util-select`, reads the property with `hast-util-get-attribute`, rewrites the URI path extension with `uri-js` / `upath`, and writes it back.
- **Coupling**
  - `hast-util-select` 5 (6 now). No remark or unified import.
- **Change**
  - Keep; bump `hast-util-select` and `@types/hast`. Tests run the transformer directly on hand-built trees and need no change.

### `vfm-internal-utils`

Source: `packages/vfm-internal-utils/src/element-customizer.ts`.

- **Mechanism**
  - `buildElement(tagName, props, children, customizer)` builds an element through hastscript, accepting either extra properties or a factory that receives a tag-aware `h`. `HastPropertiesSchema` is a valibot schema for `hast.Properties`.
- **Coupling**
  - hastscript 7 `h`, `Properties`, and `Child` types. All calls pass an explicit properties object (`h(tagName, props, ...children)`), so the hastscript 9 child / properties ambiguity does not apply here, but factories supplied by users may hit it.
- **Change**
  - Keep; bump hastscript and re-check the `TagAwareH` overloads against the hastscript 9 signature.

## External plugins

| Plugin | Used by | Current | Status in remark 13 | Decision |
| --- | --- | --- | --- | --- |
| remark-attr | vfm (`attr.ts`), remark-sectionize tests | 0.11.1 | Unmaintained since 2020. Wraps every remark-parse 8 inline / block tokenizer to append `{...}` attributes. No micromark port. | Write a VFM attribute extension ([#46](https://github.com/vivliostyle/vfm/issues/46), [#211](https://github.com/vivliostyle/vfm/issues/211)). Prototype: `origin/remark-attribute`. Consumers: `code.ts` (attributes on fenced code), `slug.ts` (`{#id}` on headings), `remark-sectionize` (`{hidden}`), `figure.ts` (`{alt=...}`). |
| remark-shortcodes | vfm (`toc.ts`, `metadata.ts`) | 0.3.1 | Unmaintained. Patches `Parser.prototype.blockTokenizers`. | Keep or drop `[[toc]]` per [#207](https://github.com/vivliostyle/vfm/issues/207). If kept, a small micromark block extension or `remark-directive` 4 (`::toc`) replaces it. |
| remark-footnotes | vfm (`footnotes.ts`), footnote package tests | 2.0.0 | Deprecated. Patches `Parser.prototype`. remark-gfm 4 provides `[^id]` references and definitions but not inline notes `^[...]`. | Use remark-gfm for references / definitions. Write an inline-note micromark extension that emits the node the footnote packages consume. |
| remark-breaks | vfm (`line-breaks.ts`), remark-ruby tests | 1.0.5 | 4.0.0 is a plain mdast transformer with types. | Bump. |
| remark-frontmatter | vfm (`revive-parse.ts`, `metadata.ts`) | 2.0.0 | 5.0.0 is a micromark extension with types. | Bump. |
| remark-math | – | – | 6.0.0 (`micromark-extension-math` 3.1.0, `mdast-util-math` 3.0.0). Emits `inlineMath` / `math` nodes with `value`. | Candidate to replace the `math.ts` tokenizer ([#224](https://github.com/vivliostyle/vfm/issues/224)). Node names and the `value` field differ from VFM's `inlineMath` / `displayMath` with `data.value`. |
| rehype-raw | vfm, dpub / sectionize / table-cell tests | 5.1.0 | 7.0.0 (`hast-util-raw` 9). | Bump. |
| rehype-format | vfm (`format.ts`), all tests | 3.1.0 | 5.0.1 ships types. | Bump; delete the ambient declarations. |
| rehype-stringify | vfm, all tests | 8.0.0 | 10.0.1. | Bump. |

### hast / unist utilities

| Package | Current | Target | Used by |
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
| mdast-util-find-and-replace | 2.2.2 | 3.x | vfm (`math.ts`, to be removed) |
| refractor | 3.6.0 | 5.0.0 | vfm (`code.ts`) |
| to-vfile / vfile | 6.1 / 4.0 | 8.0 / 6.0 | vfm, sectionize |

## Order of work

1. Define the VFM-owned node shapes first: inline note, ruby, attribute carrier, `[[toc]]` (if kept). The footnote packages, `slug.ts`, `metadata.ts`, and `remark-sectionize` all read them.
2. Bump the shared hast / unist utilities and `hastscript` across every package in one step, because the packages import each other through `workspace:*`.
3. Port `vfm-internal-utils` and `rehype-rewrite-extension` (Keep), then `mdast-to-hast-table-cell` and `remark-sectionize` (Adapt), then the footnote packages, then `remark-ruby`.
4. Rewrite each package's test utilities together with the package; they are the only place the remark-parse 8 options and `remark-footnotes` / `remark-attr` devDependencies remain.
