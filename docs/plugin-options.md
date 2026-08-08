# Plugin options

VFM declares its plugin options as [valibot](https://valibot.dev/) schemas, and exports the schemas together with their inferred TypeScript types. Type inference and runtime validation are handled by a single source of truth.

`StringifyMarkdownOptionsSchema` validates the whole options of the `stringify` / `VFM` API.

```ts
import { StringifyMarkdownOptionsSchema } from '@vivliostyle/vfm';
import * as v from 'valibot';

const options = v.parse(StringifyMarkdownOptionsSchema, userInput);
```

The schema is composed with `v.intersect`, and per-plugin sub-schemas are exported individually so downstream tools (e.g. [Vivliostyle CLI](https://github.com/vivliostyle/vivliostyle-cli)) can reuse only what they need. Each exported schema has a matching inferred type of the same name without the `Schema` suffix (e.g. `FigureOptionsSchema` and `FigureOptions`).

| Schema | Description |
| --- | --- |
| `StringifyMarkdownOptionsSchema` | Whole options of `stringify` / `VFM` (includes `editPlugins` and `replace`). |
| `SerializablePluginOptionsSchema` | Plugin options that can be expressed as serializable data. The shared core between programmatic input and YAML frontmatter. |
| `VFMSettingsSchema` | The `vfm:` field of YAML frontmatter. |
| `LineBreaksOptionsSchema` | `hardLineBreaks`. |
| `MathOptionsSchema` / `MathRendererSchema` | `math` and `mathRenderer`. |
| `DocumentSerializableOptionsSchema` | `partial`. |
| `FormatOptionsSchema` | `disableFormatHtml`. |
| `CodeOptionsSchema` | `assignIdToFigcaption` for code block captions. |
| `FigureOptionsSchema` / `ImgFigcaptionOrderSchema` / `CaptionlessImagePolicySchema` | `imgFigcaptionOrder`, `assignIdToFigcaption` and `captionlessImagePolicy`. |
| `FigcaptionInlineOptionsSchema` | `parseFigcaptionAsInline`. |
| `FootnoteOptionsSchema` / `FootnoteModeSchema` / `YamlFootnoteOptionsSchema` | `footnote`. The `Yaml` variant restricts customizer fields to YAML-safe values. |
| `ReplaceOptionsSchema` / `ReplaceRuleSchema` | `replace` hook rules. |
| `RewriteRelativeHrefExtensionsOptionsSchema` | `rewriteRelativeHrefExtensions`. |
| `TableOptionsSchema` / `TableCellPresetSchema` / `YamlTableOptionsSchema` | `table`. The `Yaml` variant accepts only the string presets. |

Each schema field carries a `v.description(...)`, so documentation for the options can be rendered mechanically from the schemas.
