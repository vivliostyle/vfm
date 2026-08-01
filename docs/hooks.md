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

Splice, drop, or extend the built-in unified plugin lists just before VFM builds the processor, with the `editPlugins` option. The following example appends [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings) to the end of the hast (Hypertext AST) stage.

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

The argument `plugins` carries the built-in plugin lists assembled by VFM.

- `mdastPlugins`: remark (Markdown AST) plugins.
- `mdastToHastHandlers`: mdast-util-to-hast handlers used in the mdast to hast conversion.
- `hastPlugins`: rehype (Hypertext AST) plugins.

The return value replaces the assembled pipeline. Only head-prepend and tail-append to the built-in lists are behaviorally stable across minor releases: VFM may reorder, remove, or insert built-in plugins in any minor or patch release.
