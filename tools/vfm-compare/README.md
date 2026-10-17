# @vivliostyle/vfm-compare

Workspace-only harness for the remark 13 migration ([#295](https://github.com/vivliostyle/vfm/issues/295)). It runs the same Markdown through `packages/vfm` (remark 8) and `packages-next/vfm` (remark 13) and reports where the HTML differs. It is never published.

## Usage

Both packages must be built first.

```bash
pnpm build
# test inputs of packages/*/tests and the samples of docs/vfm.md, docs/ja/vfm.md, one option set ({ partial: true })
pnpm --filter ./tools/vfm-compare compare
# every combination of partial / hardLineBreaks / math / footnote (24 option sets), report to a file
pnpm --filter ./tools/vfm-compare compare -- --matrix --out report.md --json results.json
# a book written in VFM (every .md under the path), plus one explicit option set
pnpm --filter ./tools/vfm-compare compare -- --md ../some-book --options '{"partial":true,"parseFigcaptionAsInline":true}'
```

| Flag | Meaning |
| --- | --- |
| `--tests` | Inputs of every `*.test.ts` under `packages/*/tests`: the first argument of `buildProcessorTestingCode`, `buildHtmlTestingCode`, `stringify`, `readMetadata`, `processSync` and `render`, given as a literal, a `stripIndent` template or a variable initialized with one. |
| `--docs` | The fenced `md` / `markdown` blocks of `docs/vfm.md` and `docs/ja/vfm.md`. |
| `--md <path>` | Whole `.md` files under a path (repeatable). The corpus is not part of the repository; clone a VFM book next to the checkout. |
| `--matrix` | The 24 option sets of the migration issue. Default: `{ partial: true }`. |
| `--options <json>` | One explicit option set (`StringifyMarkdownOptions`). |
| `--out <file>` | Write the Markdown report to a file instead of stdout. |
| `--json <file>` | Also write the inputs and every result as JSON. |

Without `--tests`, `--docs` or `--md`, the test inputs and the documentation samples are used. Duplicate inputs are compared once.

## What counts as a difference

The HTML of both generations is normalized before the comparison: line endings unified, whitespace between tags removed, runs of ASCII whitespace collapsed. Non-ASCII spaces (U+3000, U+00A0) are kept because VFM issues concern them. The report counts

- `same`: identical after normalization
- `whitespace only`: differs only in whitespace (rehype-format 3 vs 5 and similar)
- `diff`: differs
- `error`: one generation threw (both throwing with the same message counts as `same`)

Each differing input is listed once with the option sets it differs under, the input, and the context around the first difference. Classify the differences by hand into the three categories of [#293](https://github.com/vivliostyle/vfm/issues/293) and record them there.

## Layout

- `src/corpus.mjs`: corpus builders (test files through the TypeScript compiler API, documentation blocks, Markdown files)
- `src/compare.mjs`: option matrix, normalization, comparison
- `src/report.mjs`: Markdown report
- `src/cli.mjs`: command line
