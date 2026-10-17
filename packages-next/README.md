# packages-next

Next-generation VFM packages built on remark 13+ / unified 11. See [#275](https://github.com/vivliostyle/vfm/issues/275) for the migration plan and [CONTRIBUTING.md](../CONTRIBUTING.md) for the development rules during the co-existence period.

- Every package here is `"private": true` and carries the `-next` suffix in its name. Nothing in this directory is published.
- When the migration is complete, `packages/` becomes `packages-old/` and this directory becomes `packages/`.

## Status

Phase 2 ([#281](https://github.com/vivliostyle/vfm/issues/281)) is done: the next tree builds and tests on unified 11, remark-parse 11, remark-gfm 4, mdast-util-to-hast 13, hastscript 9 and the current hast / unist utilities. Phase 3 ([#285](https://github.com/vivliostyle/vfm/issues/285)) re-implements the VFM syntaxes as micromark extensions; ruby (`remark-ruby`, [#286](https://github.com/vivliostyle/vfm/issues/286)), math (`math`, [#287](https://github.com/vivliostyle/vfm/issues/287)) and attributes (`remark-attribute`, [#288](https://github.com/vivliostyle/vfm/issues/288)) are done. The remaining syntaxes are not parsed yet; their tests are marked `test.skip` with a `TODO(#nnn)` pointing at the issue that restores them.

| Syntax | Slot | Restored by |
| --- | --- | --- |
| Inline footnotes `^[...]` | `footnote` | [#289](https://github.com/vivliostyle/vfm/issues/289) |
| `[[toc]]` | `toc` | [#290](https://github.com/vivliostyle/vfm/issues/290) |
| Inline markup in image captions (`parseFigcaptionAsInline`) | `parseImageAltAsInline` | [#292](https://github.com/vivliostyle/vfm/issues/292) |

Known output differences to decide on in Phase 4 ([#293](https://github.com/vivliostyle/vfm/issues/293)): an image with an empty alt now renders `alt=""` (mdast-util-to-hast 13), and a trailing space after a lone image no longer keeps it a paragraph (micromark strips it).
