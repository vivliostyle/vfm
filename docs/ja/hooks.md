# Hooks

## Replace

```markdown
[icon1][notice]

[person][nod nod]
```

```js
const rules = [
  {
    test: /\[(.+?)\]\[(.+?)\]/,
    match: ([, a, b], h) => {
      return h(
        'div',
        {class: 'balloon'},
        h('img', {src: `./img/${a}.png`}),
        h('span', b),
      );
    },
  },
];

stringify(markdown, {
  partial: true,
  replace: rules,
});
```

```html
<p><div class="balloon"><img src="./img/icon1.png"><span>Notice</span></div></p>
<p><div class="balloon"><img src="./img/person.png"><span>Nod nod</span></div></p>
```

## Edit plugins

VFM がプロセッサを構築する直前に、内部で組み立てる unified プラグイン配列を `editPlugins` オプションで挿入・削除・置換します。以下は hast (Hypertext AST) 段階の末尾へ [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings) を追加する例です。

```js
import { VFM } from '@vivliostyle/vfm';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const processor = VFM({
  editPlugins(plugins) {
    return {
      ...plugins,
      hastPlugins: [
        ...plugins.hastPlugins,
        [rehypeAutolinkHeadings, { behavior: 'append' }],
      ],
    };
  },
});
```

引数 `plugins` には VFM が組み立てた組み込みプラグインの一覧が渡されます。

- `mdastPlugins`: remark (Markdown AST) プラグイン。
- `mdastToHastHandlers`: mdast から hast への変換で使われる mdast-util-to-hast ハンドラー。
- `hastPlugins`: rehype (Hypertext AST) プラグイン。

戻り値が組み立て済みパイプラインを置き換えます。マイナー リリース間で挙動が安定しているのは、組み込みリストの先頭への追加と末尾への追加だけです。VFM はマイナーまたはパッチ リリースで組み込みプラグインの並べ替え・削除・挿入を行うことがあります。
