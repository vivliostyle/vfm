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
