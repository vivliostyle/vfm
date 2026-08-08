# プラグインオプション (Plugin options)

VFM はプラグインのオプションを [valibot](https://valibot.dev/) スキーマとして宣言し、スキーマとそこから推論した TypeScript 型を export しています。型推論と実行時検証を単一の情報源で両立します。

`StringifyMarkdownOptionsSchema` は `stringify` / `VFM` API のオプション全体を検証します。

```ts
import { StringifyMarkdownOptionsSchema } from '@vivliostyle/vfm';
import * as v from 'valibot';

const options = v.parse(StringifyMarkdownOptionsSchema, userInput);
```

スキーマは `v.intersect` で構成されており、プラグインごとのサブスキーマも個別に export されているため、下流のツール (例: [Vivliostyle CLI](https://github.com/vivliostyle/vivliostyle-cli)) は必要なものだけ再利用できます。export された各スキーマには、`Schema` 接尾辞を除いた同名の推論型があります (例: `FigureOptionsSchema` と `FigureOptions`)。

| スキーマ | 説明 |
| --- | --- |
| `StringifyMarkdownOptionsSchema` | `stringify` / `VFM` のオプション全体 (`editPlugins` と `replace` を含む)。 |
| `SerializablePluginOptionsSchema` | シリアライズ可能なデータとして表現できるプラグインオプション。プログラムからの入力と YAML フロントマターの共通コア。 |
| `VFMSettingsSchema` | YAML フロントマターの `vfm:` フィールド。 |
| `LineBreaksOptionsSchema` | `hardLineBreaks`。 |
| `MathOptionsSchema` / `MathRendererSchema` | `math` と `mathRenderer`。 |
| `DocumentSerializableOptionsSchema` | `partial`。 |
| `FormatOptionsSchema` | `disableFormatHtml`。 |
| `CodeOptionsSchema` | コードブロックのキャプション向け `assignIdToFigcaption`。 |
| `FigureOptionsSchema` / `ImgFigcaptionOrderSchema` / `CaptionlessImagePolicySchema` | `imgFigcaptionOrder`、`assignIdToFigcaption`、`captionlessImagePolicy`。 |
| `FigcaptionInlineOptionsSchema` | `parseFigcaptionAsInline`。 |
| `FootnoteOptionsSchema` / `FootnoteModeSchema` / `YamlFootnoteOptionsSchema` | `footnote`。`Yaml` 版はカスタマイズ用フィールドを YAML で表現できる値に制限する。 |
| `ReplaceOptionsSchema` / `ReplaceRuleSchema` | `replace` フックのルール。 |
| `RewriteRelativeHrefExtensionsOptionsSchema` | `rewriteRelativeHrefExtensions`。 |
| `TableOptionsSchema` / `TableCellPresetSchema` / `YamlTableOptionsSchema` | `table`。`Yaml` 版は文字列プリセットのみ受け付ける。 |

各スキーマのフィールドは `v.description(...)` を持つため、オプションのドキュメントをスキーマから機械的に生成できます。
