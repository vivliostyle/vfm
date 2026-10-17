# @vivliostyle/remark-footnote-inline

remark plugin for the inline footnote syntax `^[...]` used by [VFM](https://github.com/vivliostyle/vfm), as in Pandoc. Footnote references and definitions (`[^id]`, `[^id]: ...`) are handled by [remark-gfm](https://github.com/remarkjs/remark-gfm); this plugin adds the inline form that remark-gfm does not support.

```markdown
Footnotes can also be written inline^[This part is a footnote.].
```

## Exports

- `mdast`: remark plugin. Registers the micromark syntax extension and the `mdast-util-from-markdown` extension on the processor.
- `footnoteInlineSyntax()`, `footnoteInlineFromMarkdown()`: the two extensions, for use without remark.
- `Footnote`: the mdast node. `{ type: 'footnote', children: PhrasingContent[] }`, registered in `PhrasingContentMap`. It is the node remark-footnotes 2 produced, so the VFM footnote handlers (`remark-footnote-dpub` / `gcpm` / `pandoc`) consume it unchanged.

## Syntax

- `^[` starts a note and `]` ends it. The note text is parsed as inline Markdown.
- Brackets pair from the inside out: in `^[see [a](b)]` the link closes first.
- `^[]` is not a note and stays text. A `^` not followed by `[` is plain text (`x^2`).
- A note may span lines inside a paragraph, but not a blank line.

No HTML is produced by this plugin itself. VFM's footnote mode decides whether the note becomes an endnote, a `<aside role="doc-footnote">` or a `<span class="footnote">`.
