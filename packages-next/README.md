# packages-next

Next-generation VFM packages built on remark 13+ / unified 11. See [#275](https://github.com/vivliostyle/vfm/issues/275) for the migration plan and [CONTRIBUTING.md](../CONTRIBUTING.md) for the development rules during the co-existence period.

- Every package here is `"private": true` and carries the `-next` suffix in its name. Nothing in this directory is published.
- When the migration is complete, `packages/` becomes `packages-old/` and this directory becomes `packages/`.

## Status

Phase 2 ([#281](https://github.com/vivliostyle/vfm/issues/281)) is done: the next tree builds and tests on unified 11, remark-parse 11, remark-gfm 4, mdast-util-to-hast 13, hastscript 9 and the current hast / unist utilities. Phase 3 ([#285](https://github.com/vivliostyle/vfm/issues/285)) re-implemented the VFM syntaxes as micromark extensions and is done: ruby (`remark-ruby`, [#286](https://github.com/vivliostyle/vfm/issues/286)), math (`math`, [#287](https://github.com/vivliostyle/vfm/issues/287)), attributes (`remark-attribute`, [#288](https://github.com/vivliostyle/vfm/issues/288)), inline footnotes (`remark-footnote-inline`, [#289](https://github.com/vivliostyle/vfm/issues/289)), `[[toc]]` shortcodes (`toc`, [#290](https://github.com/vivliostyle/vfm/issues/290); whether the feature stays is decided in [#207](https://github.com/vivliostyle/vfm/issues/207)), the remark-frontmatter 5 / remark-breaks 4 update with the `readMetadata` processor ([#291](https://github.com/vivliostyle/vfm/issues/291)) and the figcaption re-parse of `parseFigcaptionAsInline`, which now reads the caption from the Markdown source instead of `Image.alt` ([#292](https://github.com/vivliostyle/vfm/issues/292)). The one remaining `test.skip` carries a `TODO(#293)`.

Known output differences to decide on in Phase 4 ([#293](https://github.com/vivliostyle/vfm/issues/293)): an image with an empty alt now renders `alt=""` (mdast-util-to-hast 13), a trailing space after a lone image no longer keeps it a paragraph (micromark strips it), and `Image.alt` is the decoded plain text of the label as in CommonMark (`![**bold**](i.png)` gives `alt="bold"`; `![{Ruby|るび}](i.png)` gives `alt="Ruby"` and the same literal figcaption unless `parseFigcaptionAsInline` is on) where remark-parse 8 kept the Markdown source. Math is the exception: its label fallback keeps `$...$` in `alt` on purpose.

Intended fixes that come with the new dependencies: with `hardLineBreaks`, remark-breaks 4 keeps the full-width space ([#186](https://github.com/vivliostyle/vfm/issues/186)) and the no-break space ([#110](https://github.com/vivliostyle/vfm/issues/110)) that follow a line break.
