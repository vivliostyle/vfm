# remark 13 Migration Notes

Working notes for migrating the VFM Markdown toolchain from remark 8 / unified 9 to remark 13+ (remark-parse 11, unified 11, mdast-util-to-hast 13). This document records the Phase 0 survey and the migration policy. Progress is tracked in GitHub: [#275](https://github.com/vivliostyle/vfm/issues/275) is the umbrella issue, and each phase has its own sub-issue.

| Phase | Issue | Scope |
| --- | --- | --- |
| 0 | [#276](https://github.com/vivliostyle/vfm/issues/276) | Survey of the current implementation and migration policy (this document) |
| 1 | [#280](https://github.com/vivliostyle/vfm/issues/280) | Scaffold `packages-next/` |
| 2 | [#281](https://github.com/vivliostyle/vfm/issues/281) | Update the base libraries (unified / vfile / mdast-util-to-hast / rehype) |
| 3 | [#285](https://github.com/vivliostyle/vfm/issues/285) | Re-implement syntax plugins on micromark |
| 4 | [#293](https://github.com/vivliostyle/vfm/issues/293) | Compatibility verification and test porting |
| 5 | [#296](https://github.com/vivliostyle/vfm/issues/296) | Switch the current tree and publish |

Phases 2 and 3 can partly run in parallel. Phase 4 proceeds incrementally as each syntax from Phase 3 lands.

## Migration policy

- The remark 13+ code base is called **next**.
- The monorepo holds the current tree (`packages/`) and the next tree (`packages-next/`) side by side. Mixing both generations under `packages/` is hard to operate, so they live in separate directories.
- `packages-next/` starts as a copy of `packages/` and is modified from there.
- Every next package is `"private": true` so that nothing is published by accident, and its `name` carries the `-next` suffix so that pnpm `--filter` and `workspace:*` resolution stay unambiguous.
- Both trees are pnpm workspace members and are built and tested by the root `pnpm build` / `pnpm test`.
- Once next reproduces the behavior of the current VFM, the trees are swapped: `packages/` → `packages-old/`, `packages-next/` → `packages/`. The `-next` suffix and `"private": true` are removed and the packages are published as a major release.

Completion criteria:

- `packages/` is the next tree and the equivalent of the current test suite passes.
- `@vivliostyle/vfm` and every sub-package are published as a major update.

## Current state (Phase 0 survey)

Surveyed against `main` as of 2026-10.

### Toolchain

- The toolchain is already ESM (`"type": "module"`, plain `tsc` output, vitest 4). There are no CJS-specific idioms left.
- What is still old is the dependency set and the code written against it: unified 9, remark-parse 8, remark-rehype 8, mdast-util-to-hast 10 and 11 (two generations are installed at once), vfile 4, and `@types/{unist,mdast,hast}` 2/3/2.
- No package has an `exports` field. The deep imports shown in the README (`@vivliostyle/vfm/lib/revive-parse`, `@vivliostyle/vfm/lib/revive-rehype`) rely on that.
- Before this document there was no dedicated migration document. The `@todo` / `TODO` comments in the sources were the de facto migration notes:
  - `packages/vfm/src/plugins/code.ts` – drop the hast fields after `mdast-util-to-hast@>=13`
  - `packages/vfm/src/plugins/replace.ts` – drop the interface pinning once `hastscript` exposes the type
  - `packages/vfm/src/plugins/figure.ts` – re-parsing `Image.alt` relies on remark-parse 8 behavior
  - `packages/remark-ruby/src/ruby.ts` – drop `hName` after `mdast-util-to-hast@>=13`
  - `packages/remark-sectionize/src/section.ts` – drop the hast fields after `mdast-util-to-hast@>=13`; handle `@subtitle`

### Target versions

Latest releases as of 2026-10-17 (unchanged since the 2026-09 survey).

| Package | Current | Target |
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

### Implementation classification of `packages/vfm` ([#277](https://github.com/vivliostyle/vfm/issues/277))

Classified by how each module participates in the remark pipeline. The module-by-module inventory, including the exact remark 8 coupling of each file and the tests it affects, is in [remark13-vfm-inventory.md](./remark13-vfm-inventory.md).

| Role | Count | Modules |
| --- | --- | --- |
| remark-parse legacy tokenizer | 1 | math |
| mdast transformer | 6 | slug, code, toc, figure, metadata, document |
| to-hast handler | 6 slots | math (inline / display), code, figure (via paragraph), table, footnote (3 variants) |
| hast transformer | 6 | figure, replace, document, math, format, rewrite-extension |
| wrapper / schema only | 5 | attr, line-breaks, options, table, footnotes |

- `math.ts` plays three roles: tokenizer, handler, and hast transformer.
- `figure.ts` plays three roles: mdast transformer, handler, and hast transformer.
- `document.ts` exports `mdast`, but it operates on the hast tree.

#### Processor composition

- Main processor (`packages/vfm/src/index.ts`, `VFM()`): `remarkParse` → 11 mdast slots (`revive-parse.ts`) → `remarkRehype` with handlers → 8 hast slots (`revive-rehype.ts`) → `rehypeStringify`.
- Second processor (`packages/vfm/src/plugins/metadata.ts`, `readMetadata()`): an independent unified processor using footnotes, attr, and frontmatter.
- The `editPlugins` hook exposes three arrays (`mdastPlugins`, `mdastToHastHandlers`, `hastPlugins`) as public API. Each slot carries a branded type via `brand<T>()`.

mdast slots, in order: parseImageAltAsInline, lineBreaks, math, ruby, footnote, attr, slug, section, code, toc, frontmatter.

hast slots, in order: raw, deriveImgAltFromFigcaption, footnote, replace, rewriteRelativeHrefExtensions, document, math, format.

#### Ordering constraints in the hast stage

- `deriveImgAltFromFigcaption` must run after `rehype-raw`, because it reads the expanded `<figcaption>`.
- `math` (MathJax script injection) must run after `document`, because it writes into `<head>`.

### Sub-packages and external plugins ([#278](https://github.com/vivliostyle/vfm/issues/278))

The package-by-package survey, including the exact upstream output each footnote package depends on, is in [remark13-subpackages.md](./remark13-subpackages.md).

#### Sub-packages

| Package | Involvement | Impact |
| --- | --- | --- |
| remark-ruby | legacy tokenizer + handler | Large (re-implementation) |
| remark-footnote-dpub / gcpm | handler + hast | Medium |
| remark-footnote-pandoc | hast only | Medium (the endnote output structure it expects changes) |
| remark-sectionize | mdast transformer | Small (types only) |
| mdast-to-hast-table-cell | handler | Medium (deep import) |
| rehype-rewrite-extension | hast only | Small |
| vfm-internal-utils | hastscript only | Small |

`remark-ruby` imports types from `remark-parse`, which it lists only in `devDependencies`, so its published `.d.ts` depends on a devDependency.

#### External plugins

| Plugin | Current | Status |
| --- | --- | --- |
| remark-attr | 0.11 | Unmaintained. Needs an in-house replacement ([#46](https://github.com/vivliostyle/vfm/issues/46), [#211](https://github.com/vivliostyle/vfm/issues/211)). Prototype: `origin/remark-attribute` branch (attribute extension for remark-parse 11) |
| remark-shortcodes | 0.3 | Unmaintained. Keep or drop is decided in [#207](https://github.com/vivliostyle/vfm/issues/207) |
| remark-footnotes | 2 | Deprecated. Merged into remark-gfm, which does not support inline notes `^[...]` |
| remark-breaks | 1 | Supported by 4.x |
| remark-frontmatter | 2 | Supported by 5.x |
| remark-math | – | 6.x is available (candidate for [#224](https://github.com/vivliostyle/vfm/issues/224)) |

### Breaking points ([#279](https://github.com/vivliostyle/vfm/issues/279))

Places that are guaranteed to break on remark 13. The phase issues refer to this list.

1. **Legacy tokenizer extensions.** Adding to `this.Parser.prototype.inlineTokenizers` / `inlineMethods` (`packages/vfm/src/plugins/math.ts`, `packages/remark-ruby/src/ruby.ts`). remark 13 silently ignores them. Rewrite as micromark extensions.
2. **to-hast handler signature.** `(h, node)` with `all(h, node)` / `one(h, ...)` becomes `(state, node, parent)` with `state.all()` / `state.one()`. Affects every handler plus `buildFigure`, `buildDisplayMath`, `withTableCellTransform`, and the three footnote packages.
3. **unified import style.** `import unified from 'unified'` and namespace types such as `unified.Plugin` / `unified.Pluggable` are gone. `brand`, `mergePlugins`, and `partial` in `utils.ts` are built on them.
4. **remark-parse options.** `{ gfm: true, commonmark: true }` no longer exists. GFM is enabled through remark-gfm.
5. **Deep imports.** `mdast-util-to-hast/lib/handlers/table.js` (`packages/vfm/src/revive-rehype.ts`, `packages/mdast-to-hast-table-cell/tests`) is closed off by the `exports` field in v13.
6. **Re-parsing `alt`.** `this.parse(image.alt)` in `packages/vfm/src/plugins/figure.ts` relies on remark-parse 8 behavior (see the `TODO` comment there).
7. **Tests of parser internals.** `packages/vfm/tests/defs.test.ts` (6 tests) asserts `vfm.Parser.prototype.inlineMethods` and friends, which do not exist anymore.
8. **`@types/mdast` 4 type names.** `StaticPhrasingContentMap` → `PhrasingContentMap`, `Content` / `HTML` removed, and so on. Module augmentation is spread over `packages/vfm/src/plugins/{code,math,toc}.ts`, `packages/vfm/types/remark.d.ts`, `packages/remark-ruby/src/ruby.ts`, `packages/remark-sectionize/src/section.ts`, and `packages/mdast-to-hast-table-cell/tests/rehype-format.d.ts`.
9. **MDAST expectations.** Tests compare `unist-util-inspect` dump strings, so most of them need rewriting once node structures change.

## References

- Prototype: `origin/remark-attribute` branch (attribute extension for remark-parse 11)
- [#45](https://github.com/vivliostyle/vfm/issues/45): migration examples for remark-frontmatter, remark-directive, and remark-footnotes
- [#192](https://github.com/vivliostyle/vfm/issues/192): the staged plan (Node 22, ESM, unified update, remark update). The first two stages are complete.
