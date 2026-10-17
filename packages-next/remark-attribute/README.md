# @vivliostyle/remark-attribute

remark plugin for the attribute syntax `{#id .class key=value}` used by [VFM](https://github.com/vivliostyle/vfm). It replaces [remark-attr](https://github.com/arobase-che/remark-attr), which only works with remark-parse 8.

```markdown
# Heading {#intro .title}

![caption](./img.png){#fig1 data-sample="sample"}

Use **this**{.strong} word.
```

```html
<h1 id="intro" class="title">Heading</h1>
<p><img src="./img.png" alt="caption" id="fig1" data-sample="sample"></p>
<p>Use <strong class="strong">this</strong> word.</p>
```

## Exports

- `mdast`: remark plugin. Registers the micromark syntax extension and the `mdast-util-from-markdown` extension on the processor. Takes `Options`.
- `attributeSyntax()`, `attributeFromMarkdown(options)`: the two extensions, for use without remark.
- `Options`, `AttributeInline`, `AttributeBlock`: types.

## Syntax

An attribute list is `{` … `}` on one line with any of:

- `#id`
- `.class` (several may be given; they are joined)
- `key`, `key=value`, `key="value"`, `key='value'`

Where it is written decides what it applies to:

- **Inline**: right after `**strong**`, `*emphasis*`, `` `code` ``, `~~delete~~`, `[link](url)`, `![image](url)`, a link / image reference or a footnote reference, with no space in between. The attributes go to that node.
- **Heading**: at the end of a heading line (`# Title {.class}`). The attributes go to the heading, and trailing whitespace is removed from the text. A heading that holds nothing but the attribute list keeps it as text.
- **Block**: alone on the line right after a heading or a fenced code block (`# Title\n{.class}`). The attributes go to that block.

Attribute lists that do not attach to anything stay in the text as written.

Values are decoded for character references. Attributes are written to `data.hProperties`; `mdast-util-to-hast` turns them into HTML attributes.

## Options

- `scope` (`'none' | 'global' | 'specific' | 'extended' | 'permissive' | 'every'`, default `'extended'`): which attribute names are kept, following remark-attr. VFM uses `'permissive'` (everything except DOM event handlers).
- `extend` (`Record<string, string[]>`): extra attribute names per mdast node type (or `'*'`) for the `'extended'` scope.
- `allowDangerousDOMEventHandlers` (`boolean`, default `false`): keep `on*` attributes.
- `enableAtxHeaderInline` (`boolean`, default `true`): attach a trailing attribute list to the heading itself.
- `disableBlockElements` (`boolean`, default `false`): ignore block attribute lines.

## Fenced code

The info string of a fenced code block (`` ```js title=app.js {#code-id} ``) is not handled here. VFM reads attributes from `code.meta` in its own code plugin.
