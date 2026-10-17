# remark 13 Migration: `packages/vfm` Inventory

Module-by-module inventory of `packages/vfm` for the remark 13 migration (Phase 0-1, [#277](https://github.com/vivliostyle/vfm/issues/277)). It expands the summary in [remark13-migration.md](./remark13-migration.md) and is meant to be used as a checklist by the Phase 2 / 3 / 4 issues. Surveyed against `main` as of 2026-10-17.

Pipeline stages used below:

- **mdast**: a unified plugin that runs on the Markdown AST (`mdastPlugins` slot).
- **handler**: an `mdast-util-to-hast` handler passed to `remark-rehype` (`mdastToHastHandlers` slot).
- **hast**: a unified plugin that runs on the HTML AST (`hastPlugins` slot).
- **wrapper / schema**: no tree access of its own. Wraps an external plugin or only defines option schemas.

Change class:

- **Rewrite**: the mechanism no longer exists in remark 13 (legacy tokenizers, unified namespace types, remark-parse options).
- **Adapt**: the same mechanism exists with a different API (handler signature, renamed types, major bumps of hast utilities).
- **Keep**: no remark version coupling. Only the shared type packages move.

## Processor composition

### Main processor (`src/index.ts`, `VFM()`)

```
remark-parse { gfm, commonmark }
  → mdastPlugins (11 slots, revive-parse.ts)
  → inspect('mdast')
  → remark-rehype { allowDangerousHtml, handlers }
  → hastPlugins (8 slots, revive-rehype.ts)
  → inspect('hast')
  → rehype-stringify
```

| # | mdast slot (`revive-parse.ts`) | Source | Note |
| --- | --- | --- | --- |
| 1 | `parseImageAltAsInline` | figure.ts | Re-parses `Image.alt` through `this.parse()` |
| 2 | `lineBreaks` | line-breaks.ts | remark-breaks when `hardLineBreaks` |
| 3 | `math` | math.ts | Legacy tokenizer; `findAndReplace` fallback |
| 4 | `ruby` | @vivliostyle/remark-ruby | Legacy tokenizer |
| 5 | `footnote` | footnotes.ts | remark-footnotes `{ inlineNotes: true }` |
| 6 | `attr` | attr.ts | remark-attr |
| 7 | `slug` | slug.ts | Sets `data.hProperties.id` |
| 8 | `section` | @vivliostyle/remark-sectionize | |
| 9 | `code` | code.ts | Reads attributes written by remark-attr |
| 10 | `toc` | toc.ts | remark-shortcodes + filter |
| 11 | `frontmatter` | remark-frontmatter | |

| Handler slot (`revive-rehype.ts`) | Source | Note |
| --- | --- | --- |
| `displayMath` | math.ts | |
| `inlineMath` | math.ts | |
| `ruby` | @vivliostyle/remark-ruby | |
| `code` | code.ts | |
| `paragraph` | revive-rehype.ts | Composite: `buildDisplayMath` ?? `buildFigure` ?? default `<p>` |
| `table` | mdast-to-hast-table-cell | Wraps the default `table` handler imported via deep import |
| `footnoteDefinition` / `footnoteReference` / `footnote` | footnote packages | `undefined` entries are stripped to fall back to the defaults |

| # | hast slot (`revive-rehype.ts`) | Source | Note |
| --- | --- | --- | --- |
| 1 | `raw` | rehype-raw | |
| 2 | `deriveImgAltFromFigcaption` | figure.ts | Must follow `raw` |
| 3 | `footnoteTransformer` | footnote packages | |
| 4 | `replace` | replace.ts | |
| 5 | `rewriteRelativeHrefExtensions` | @vivliostyle/rehype-rewrite-extension | |
| 6 | `document` | document.ts | Wraps the tree in `<html>`; skipped when `partial` |
| 7 | `math` | math.ts | Must follow `document` (writes `<head>`) |
| 8 | `format` | format.ts | rehype-format unless `disableFormatHtml` |

Other characteristics of `VFM()`:

- `.data('settings', { position: true })` is passed to remark-parse 8. remark-parse 11 has no `position` setting; positions are always attached.
- The `editPlugins` hook receives the three lists and may return any pluggable lists. The branded slot types (`brand<T>()`) are nominal only and are documented as not being a SemVer contract.
- `undefined` handler entries are stripped before they reach `remark-rehype` so that the default handlers are not overwritten.

### Second processor (`src/plugins/metadata.ts`, `readMetadata()`)

```
remark-parse { gfm, commonmark } → footnotes → attr → frontmatter → mdast (metadata reader)
  → remark-rehype → rehype-stringify
```

- Exists only to populate `vfile.data` from frontmatter YAML, the first heading, and `[[toc]]`. The HTML output is discarded.
- `.data('settings', { position: false })` has no effect in remark 13.
- The plugin list is cast to `unified.PluggableList<unified.Settings>`, a namespace type that disappears with unified 11.
- The heading lookup via `unist-util-select` is typed as a hast `Element` although the tree is mdast. Harmless at runtime, but the cast must change with `@types/mdast` 4.

## Module inventory

### `src/plugins/`

| File | Stage | Exports | remark 8 coupling | Change |
| --- | --- | --- | --- | --- |
| `attr.ts` | wrapper | `mdast` | remark-attr 0.11 patches `Parser.prototype` tokenizers. Unmaintained. | **Rewrite** as a micromark / mdast extension ([#46](https://github.com/vivliostyle/vfm/issues/46), [#211](https://github.com/vivliostyle/vfm/issues/211)). Prototype in `origin/remark-attribute`. |
| `code.ts` | mdast + handler | `mdast`, `handler`, `CodeOptionsSchema`, `CodeOptions` | `visit` on `code` nodes; deletes `hProperties` that remark-attr writes when `meta` is empty ("bad hack" workaround); `refractor.highlight()` returns an array in v3; handler is `(h, node)` and calls `h(node.position, tag, props, children)`; augments `unist` `Data` with `hName` / `hProperties` / `hChildren` / `figcaptionTitle`. | **Adapt**. Drop the remark-attr workaround with the attr rewrite. refractor 5 returns a `Root`, take `.children`. Handler becomes `(state, node)` and builds elements with `state.patch` / `state.applyData`. Keep only the `figcaptionTitle` augmentation; `mdast-util-to-hast` 13 ships the rest. |
| `document.ts` | hast | `mdast` (name is historical; it runs on hast), `DocumentSerializableOptionsSchema`, `DocumentOptions` | Returns a new root with a `doctype` node and an `<html>` built by hastscript 7. `h('head', ...children)` spreads the children as positional arguments. Uses `vfile.stem` and the global `KeyValue` type. | **Adapt**. hastscript 9 treats the first non-string argument as properties, so children must be passed as one array. Rename the export or alias it as `hast` when the slot API is revisited. |
| `figure.ts` | mdast + handler helper + hast | `mdast` (`parseImageAltAsInline`), `buildFigure`, `hast` (`deriveImgAltFromFigcaption`), `FigureOptionsSchema`, `FigcaptionInlineOptionsSchema`, option types | `this.parse(image.alt)` relies on remark-parse 8 keeping `alt` as raw Markdown source. micromark decodes `alt` to plain text, so inline markup in a caption is lost before the plugin runs. `buildFigure` takes `H` and calls `one(h, ...)` / `all(h, ...)` from `mdast-util-to-hast` 11. Attaches non-standard `children` to an `Image` node. `parseHtml` uses `hast-util-raw` 6 (`raw(tree)`). | **Rewrite** the alt re-parse: capture the raw caption source in the micromark / from-markdown layer (for example as an extension that records the source text in `data`) instead of re-parsing `alt`. **Adapt** `buildFigure` to `state.one()` / `state.all()`, and `hast-util-raw` 9 (`raw(tree, options)`). The `Image.children` convention needs a typed node or `data` field under `@types/mdast` 4. |
| `footnotes.ts` | wrapper | `mdast`, `createFootnotePlugin`, `FootnoteModeSchema`, `FootnoteOptionsSchema`, `YamlFootnoteOptionsSchema`, re-exported factory types | remark-footnotes 2 (legacy tokenizer, deprecated) with `inlineNotes: true`. Dispatches to the three footnote packages whose handlers are `(h, node)`. The module comment documents the double `mdast-util-to-hast` 10 / 11 dependency. | **Rewrite** the parser side: remark-gfm 4 provides `footnoteDefinition` / `footnoteReference` but not inline notes `^[...]`, so an inline-note extension is required (the `footnote` node type disappears unless it is re-created). **Adapt** the handler dispatch to the v13 signature together with the footnote packages. The endnote structure generated by `mdast-util-to-hast` 13 (`<section data-footnotes>`, `user-content-` prefix, `clobberPrefix`) differs from v10 and drives the pandoc package. |
| `format.ts` | wrapper | `hast`, `FormatOptionsSchema`, `FormatOptions` | rehype-format 3, typed through an ambient `declare module`. | **Adapt**: rehype-format 5 ships types. Remove the ambient declaration. |
| `line-breaks.ts` | wrapper | `mdast`, `LineBreaksOptionsSchema`, `LineBreaksOptions` | remark-breaks 1 patches `Parser.prototype`; typed through an ambient `declare module`. | **Adapt**: remark-breaks 4 is a plain mdast transformer with types. |
| `math.ts` | mdast (tokenizer) + handler + hast | `mdast`, `handlerInlineMath`, `handlerDisplayMath`, `buildDisplayMath`, `hast`, `MathRendererSchema`, `MathOptionsSchema`, option types | Adds `inlineMath` / `displayMath` to `Parser.prototype.inlineTokenizers` / `inlineMethods` using the global `Tokenizer` type from `types/remark.d.ts`. Has a `findAndReplace` fallback for "remark 13 or later", but that runs after parsing, so `**x**` inside `$...$` is already `strong` and the fallback is not equivalent. Handlers are `(h, node)` and read `node.data.value`. Augments `StaticPhrasingContentMap`. | **Rewrite** the parser side as a micromark extension (remark-math 6 is the candidate, [#224](https://github.com/vivliostyle/vfm/issues/224); it emits `inlineMath` / `math` nodes with `value`, not `data.value`). Delete the `findAndReplace` fallback. **Adapt** handlers to `(state, node)` and `PhrasingContentMap`. The hast stage (MathJax `<script>` injection, temml output) is unaffected. |
| `metadata.ts` | mdast (own processor) | `readMetadata`, `VFMSettingsSchema`, `VFMSettings`, `Metadata`, `Attribute` | See "Second processor" above. Also: `visit(tree, 'shortcode')` depends on the remark-shortcodes node type; `readTitleFromHeading` filters `footnote` children (inline notes) and strips ruby syntax with a regex because ruby is not parsed at that point. | **Adapt** the processor construction (`import { unified }`, remark-gfm, no parse options, no `PluggableList` cast). Follow the `toc` and inline footnote decisions for the node types it filters. |
| `options.ts` | schema | `SerializablePluginOptionsSchema`, `SerializablePluginOptions` | None. | **Keep**. |
| `replace.ts` | hast | `replace`, `ReplaceRuleSchema`, `ReplaceOptionsSchema`, `ReplaceRule`, `ReplaceOptions` | `hast-util-find-and-replace` 3 default import, typed through an ambient `declare module`. Hands hastscript `h` to user callbacks, so `typeof h` is public API. | **Adapt**: v5 exports `findAndReplace` by name and accepts the same `[find, replace]` list form; hastscript 9 changes the `h` typing that user callbacks see. Review the `@todo` about pinning `ReplaceRule`. |
| `rewrite-relative-href-extensions.ts` | schema + resolver | `RewriteRelativeHrefExtensionsOptionsSchema`, `resolveRewriteRelativeHrefExtensions`, option type | None. The hast work is in `@vivliostyle/rehype-rewrite-extension`. | **Keep**. |
| `slug.ts` | mdast | `mdast` | `unist-util-select` 4 and `mdast-util-to-string` 3; filters `footnote` children (inline notes); writes `heading.data.id` and `heading.data.hProperties.id`. | **Adapt** the utility majors. Keep in sync with the inline footnote node type chosen for `footnotes.ts`. |
| `table.ts` | schema + hook adapter | `resolveTableCellHook`, `TableOptionsSchema`, `YamlTableOptionsSchema`, `TableCell*` schemas and types | None directly. Depends on `@vivliostyle/mdast-to-hast-table-cell` and `@vivliostyle/vfm-internal-utils`. | **Keep**; types follow `@types/hast` 3. |
| `toc.ts` | wrapper + mdast | `mdast`, `Shortcode` | remark-shortcodes 0.3 patches `Parser.prototype.blockTokenizers` (legacy tokenizer, unmaintained, typed through an ambient `declare module`). `keepToC` removes every shortcode except `[[toc]]`. Augments `BlockContentMap`. | **Rewrite** or drop per [#207](https://github.com/vivliostyle/vfm/issues/207). If kept, `[[toc]]` needs its own micromark extension (or a directive-based syntax). `metadata.ts` depends on the same node type. |

### `src/`

| File | Role | remark 8 coupling | Change |
| --- | --- | --- | --- |
| `index.ts` | Builds `VFM()` and `stringify()`; re-exports schemas, types, and brand types | `import unified, { type Processor } from 'unified'`; `[remarkParse, { gfm: true, commonmark: true }]`; `EditedPlugins` uses `unified.Pluggable`; `settings.position`. | **Rewrite** the imports (`import { unified } from 'unified'`, `Pluggable` / `Processor` as named types). Replace the parse options with remark-gfm in the mdast slot list. Decide whether `editPlugins` keeps exposing branded slots. |
| `revive-parse.ts` | Assembles the 11 mdast slots and their brand types | `unified.Pluggable` namespace type (11 brand declarations). | **Adapt** to named `Pluggable`. Slot list changes with the attr / math / footnote / toc rewrites and the addition of remark-gfm. |
| `revive-rehype.ts` | Assembles the handlers and 8 hast slots | `import { type Handler, all } from 'mdast-util-to-hast'`; deep import `mdast-util-to-hast/lib/handlers/table.js`; the composite `paragraph` handler is `(h, node)`; `unified.Pluggable` (8 brand declarations). | **Adapt**. v13 exports `defaultHandlers.table` from the package root, closing the deep import. The paragraph handler becomes `(state, node)` with `state.all()`. |
| `utils.ts` | `debug`, `inspect`, `partial`, `brand`, `mergePlugins`, `StripFunctions` | `unified.Plugin` / `unified.Pluggable` namespace types. `partial` forwards `this` specifically so attachers can read `this.Parser`. | **Adapt** the types. `partial` can keep forwarding `this` (harmless) but the reason for it disappears with the legacy tokenizers. |
| `cli.ts` | CLI (meow) | None. | **Keep**. |

### `types/remark.d.ts`

Ambient declarations for untyped dependencies (`hast-util-find-and-replace`, `remark-shortcodes`, `rehype-format`, `remark-breaks`, `remark-attr`, `md-attr-parser`), the remark-parse 8 `Tokenizer` / `TokenizerInstance` shape, and the global `KeyValue` alias.

- The `Tokenizer` types go away with the legacy tokenizers.
- `rehype-format` 5, `remark-breaks` 4, and `hast-util-find-and-replace` 5 ship their own types.
- `remark-shortcodes` and `remark-attr` disappear with their rewrite or removal.
- `KeyValue` and the `md-attr-parser` declaration can stay or move into the module that uses them.

### Module augmentation sites

| File | Target | remark 13 counterpart |
| --- | --- | --- |
| `src/plugins/code.ts` | `unist` `Data` (`hName`, `hProperties`, `hChildren`, `figcaptionTitle`) | `mdast-util-to-hast` 13 augments `Data` with the first three |
| `src/plugins/math.ts` | `mdast` `StaticPhrasingContentMap` | `PhrasingContentMap` in `@types/mdast` 4 |
| `src/plugins/toc.ts` | `mdast` `BlockContentMap` | Still `BlockContentMap`; the `shortcode` type follows the toc decision |
| `types/remark.d.ts` | Ambient modules and globals | See above |

## Tests

| File | Depends on | Impact |
| --- | --- | --- |
| `tests/utils.ts` | `VFM().freeze()`, `vfm.parse()`, `unist-util-inspect` dumps with position and `data:` lines stripped | The MDAST comparison is by dump string. Any node shape change (for example `inlineMath` from remark-math, remark-gfm footnotes, attribute nodes) rewrites the expected strings. HTML comparison is unaffected in principle. |
| `tests/defs.test.ts` | `vfm.Parser.prototype.inlineMethods` / `blockMethods` / `interrupt*` | Cannot be ported. Replace with tests on the micromark extension list or drop. |
| `tests/edit-plugins.test.ts` | `unified` namespace types, brand types, `visit` on both trees | Type-level adaptation to unified 11; behavior should hold. |
| `tests/math.test.ts`, `tests/math-mathml.test.ts` | `inlineMath` / `displayMath` dumps, `data.value` | Node shape changes with remark-math (`value` instead of `data.value`, `math` instead of `displayMath`). |
| `tests/figure.test.ts` (largest file) | Alt re-parse, `Image.children`, HTML comments inside the paragraph | Follows the figure rewrite. The comment handling (`isHtmlComment`) depends on how micromark emits `html` nodes inside paragraphs. |
| `tests/footnotes.test.ts` | remark-footnotes node dumps, three output modes | Follows the footnote rewrite; endnote structure of `mdast-util-to-hast` 13. |
| `tests/attr.test.ts`, `tests/code.test.ts` | remark-attr output, `hProperties` dumps are stripped | HTML expectations hold if the attr rewrite is faithful. |
| `tests/metadata.test.ts` | `readMetadata` only | Mostly independent of the parser, except title extraction from headings with footnotes / ruby. |
| `tests/table.test.ts`, `tests/line-breaks.test.ts`, `tests/html-formatter.test.ts`, `tests/html-lang.test.ts`, `tests/markdown-inside-html.test.ts`, `tests/rewrite-relative-href-extensions.test.ts`, `tests/index.test.ts` | GFM tables, remark-breaks, rehype-format, document wrapper, `allowDangerousHtml` + rehype-raw | Behavior-level checks. Expect formatting differences from rehype-format 5 and whitespace differences from micromark in `markdown-inside-html`. |

## Summary by change class

| Change | Modules |
| --- | --- |
| Rewrite | attr, math (parser side), footnotes (inline notes), toc (or removal), figure (alt re-parse), index (imports / parse options) |
| Adapt | code, document, figure (handler + hast), footnotes (handler dispatch), format, line-breaks, metadata, replace, slug, revive-parse, revive-rehype, utils, types/remark.d.ts |
| Keep | options, rewrite-relative-href-extensions, table, cli |
