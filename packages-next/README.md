# packages-next

Next-generation VFM packages built on remark 13+ / unified 11. See [#275](https://github.com/vivliostyle/vfm/issues/275) for the migration plan and [CONTRIBUTING.md](../CONTRIBUTING.md) for the development rules during the co-existence period.

- Every package here is `"private": true` and carries the `-next` suffix in its name. Nothing in this directory is published.
- When the migration is complete, `packages/` becomes `packages-old/` and this directory becomes `packages/`.

## Status

Phase 2 ([#281](https://github.com/vivliostyle/vfm/issues/281)) is done: the next tree builds and tests on unified 11, remark-parse 11, remark-gfm 4, mdast-util-to-hast 13, hastscript 9 and the current hast / unist utilities. Phase 3 ([#285](https://github.com/vivliostyle/vfm/issues/285)) re-implemented the VFM syntaxes as micromark extensions and is done: ruby (`remark-ruby`, [#286](https://github.com/vivliostyle/vfm/issues/286)), math (`math`, [#287](https://github.com/vivliostyle/vfm/issues/287)), attributes (`remark-attribute`, [#288](https://github.com/vivliostyle/vfm/issues/288)), inline footnotes (`remark-footnote-inline`, [#289](https://github.com/vivliostyle/vfm/issues/289)), `[[toc]]` shortcodes (`toc`, [#290](https://github.com/vivliostyle/vfm/issues/290); whether the feature stays is decided in [#207](https://github.com/vivliostyle/vfm/issues/207)), the remark-frontmatter 5 / remark-breaks 4 update with the `readMetadata` processor ([#291](https://github.com/vivliostyle/vfm/issues/291)) and the figcaption re-parse of `parseFigcaptionAsInline`, which now reads the caption from the Markdown source instead of `Image.alt` ([#292](https://github.com/vivliostyle/vfm/issues/292)). The one remaining `test.skip` carries a `TODO(#293)`.

Known output differences to decide on in Phase 4 ([#293](https://github.com/vivliostyle/vfm/issues/293)): an image with an empty alt now renders `alt=""` (mdast-util-to-hast 13), and a trailing space after a lone image no longer keeps it a paragraph (micromark strips it).

Image `alt` and the default figcaption ([#319](https://github.com/vivliostyle/vfm/issues/319), decided: keep the next behavior): `Image.alt` is the decoded plain text of the label as in CommonMark, where remark-parse 8 kept the Markdown source. With `parseFigcaptionAsInline` off, `![**bold**](i.png)` gives `alt="bold"` and the figcaption `bold`; `![{Ruby|るび}](i.png)` gives `Ruby` (the reading is dropped), `![graph[^1]](i.png)` and `![graph^[note]](i.png)` give `graph` (`remark-footnote-inline` drops a note inside an image label so that its text does not leak into `alt`) and `![Fig: [text](url)](i.png)` gives `Fig: text`. Math is the exception and stays: `exitMath` in `math-mdast.ts` puts `$...$` back as literal text inside an image label, because the plain text of a formula without its delimiters is not readable. With `parseFigcaptionAsInline` on, the figcaption is re-parsed from the Markdown source and `alt` is derived from the rendered figcaption, so both generations agree. The rule and the comparison with the current tree are under "Text of alt and figcaption" in [docs/vfm.md](../docs/vfm.md).

Nested ruby ([#320](https://github.com/vivliostyle/vfm/issues/320), decided: keep the next behavior): `{{a|b}|c}` is a ruby whose base is a ruby, `<ruby><ruby>a<rt>b</rt></ruby><rt>c</rt></ruby>`, where the remark-parse 8 tokenizer gave the broken `<ruby>{a<rt>b</rt></ruby>|c}`. The rule and the comparison with the current tree are under "Nested ruby" in [docs/vfm.md](../docs/vfm.md).

CJK text next to emphasis ([#318](https://github.com/vivliostyle/vfm/issues/318), [#193](https://github.com/vivliostyle/vfm/issues/193)): micromark applies the CommonMark flanking rules strictly, so `**構文木（AST）**に変換` would stay literal. `remark-cjk-friendly` and `remark-cjk-friendly-gfm-strikethrough` sit right after remark-gfm in the mdast slots (`RemarkCjkFriendlyPlugin`, `RemarkCjkFriendlyGfmStrikethroughPlugin`) and keep `*` / `**` / `~~` working next to CJK characters. What still differs from the current tree is listed under "Emphasis and CJK" in [docs/vfm.md](../docs/vfm.md): intraword `_` / `__` (`それは、__「強調」__である。`) and punctuation inside the delimiters in non-CJK text stay literal, as in CommonMark.

Single tilde strikethrough ([#324](https://github.com/vivliostyle/vfm/issues/324), decided: keep the next behavior): remark-gfm 4 and `remark-cjk-friendly-gfm-strikethrough` run with their default `singleTilde: true`, so `a ~b~ c` is `a <del>b</del> c` as in the GFM specification and on GitHub, where remark-parse 8 recognized `~~` only. Two range tildes in one paragraph pair up (`3~5 個、または 7~9 個`); escape them or use another character. The rule and the comparison with the current tree are under "Strikethrough" in [docs/vfm.md](../docs/vfm.md).

Intended fixes that come with the new dependencies: with `hardLineBreaks`, remark-breaks 4 keeps the full-width space ([#186](https://github.com/vivliostyle/vfm/issues/186)) and the no-break space ([#110](https://github.com/vivliostyle/vfm/issues/110)) that follow a line break.

## Tests

`packages-next/vfm/tests` keeps the test files of `packages/vfm/tests` one to one (plus `toc.test.ts`, `syntaxes.test.ts`, `cjk-emphasis.test.ts` and `strikethrough.test.ts`). `defs.test.ts`, which inspected the remark-parse 8 `Parser.prototype`, is replaced by `syntaxes.test.ts`, which checks that the default processor turns every VFM syntax into its mdast node.

`buildProcessorTestingCode` in `tests/utils.ts` still compares the MDAST dump (`unist-util-inspect`, without position and `data`) next to the HTML. The dump is kept on purpose: it shows where micromark shapes the tree differently from remark-parse 8 (node order, `break` from remark-breaks appearing only after the transformers, decoded `alt`, ...). When a change to the parser moves the expected dump on purpose, regenerate it instead of editing it by hand:

```bash
pnpm --filter ./packages-next/vfm build
pnpm --filter ./packages-next/vfm mdast -- --options '{"math":true}' '$x = y$'
# MDAST and HTML of a file, with the test helper defaults (partial, disableFormatHtml)
cat input.md | pnpm --filter ./packages-next/vfm mdast -- --html
```

Run every next test with:

```bash
pnpm --filter './packages-next/**' test
```
