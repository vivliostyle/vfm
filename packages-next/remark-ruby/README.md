# @vivliostyle/remark-ruby

remark plugin for the ruby annotation syntax `{base|ruby}` used by [VFM](https://github.com/vivliostyle/vfm).

```markdown
{漢字|かんじ}
```

```html
<ruby>漢字<rt>かんじ</rt></ruby>
```

## Exports

- `mdast`: remark plugin. Registers the micromark syntax extension and the `mdast-util-from-markdown` extension on the processor.
- `handler`: `mdast-util-to-hast` handler for the `ruby` node (`<ruby>base<rt>ruby</rt></ruby>`).
- `rubySyntax()`, `rubyFromMarkdown()`: the two extensions, for use without remark.
- `Ruby`: the mdast node. `{ type: 'ruby', rubyText: string, children: PhrasingContent[] }`, registered in `PhrasingContentMap`.

## Syntax

- `{` starts a ruby, `|` separates the base from the ruby text, `}` ends it.
- The base is parsed as inline Markdown (`{*a*|b}`, `{[a](b)|c}`). The ruby text is literal; `{a|*b*}` renders `*b*` as is.
- An escaped pipe `\|` in the base is a pipe character, not the separator.
- Base and ruby text must both be non-empty, and the whole ruby must be on one line. Otherwise the characters stay text.
- Braces pair from the inside out, so a ruby can be the base of another ruby: `{{a|b}|c}` is `<ruby><ruby>a<rt>b</rt></ruby><rt>c</rt></ruby>`.
- The ruby text runs to the first `}`.

### Tables

GFM tables split cells at unescaped `|` before inline syntax runs, and an escaped `\|` is base text to this plugin, so a ruby cannot be written inside a table cell. See [#44](https://github.com/vivliostyle/vfm/issues/44).
