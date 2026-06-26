import { test, expect } from 'vitest';
import { stringify } from '../src/index.js';

// `--:` right, `:-:` center, `---` unaligned.
const tableMd = [
  '| P | D | N |',
  '| --: | :-: | --- |',
  '| `id` | x | y |',
].join('\n');

test('default emits the HTML4 align attribute', () => {
  const received = stringify(tableMd, { partial: true });
  const expected = `
<table>
  <thead>
    <tr>
      <th align="right">P</th>
      <th align="center">D</th>
      <th>N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="right"><code>id</code></td>
      <td align="center">x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test("'align-attribute' preset is identical to the default", () => {
  expect(
    stringify(tableMd, { partial: true, table: { cell: 'align-attribute' } }),
  ).toBe(stringify(tableMd, { partial: true }));
});

test("'align-class' preset emits table-align-* classes and drops align", () => {
  const received = stringify(tableMd, {
    partial: true,
    table: { cell: 'align-class' },
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th class="table-align-right">P</th>
      <th class="table-align-center">D</th>
      <th>N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="table-align-right"><code>id</code></td>
      <td class="table-align-center">x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('custom Properties hook receives align and tagName', () => {
  const received = stringify(tableMd, {
    partial: true,
    table: { cell: ({ align }) => (align ? { 'data-align': align } : {}) },
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th data-align="right">P</th>
      <th data-align="center">D</th>
      <th>N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-align="right"><code>id</code></td>
      <td data-align="center">x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('custom hook can branch on tagName (th for header, td for body)', () => {
  // Mark only header cells, proving the hook is handed `th` for the header row
  // and `td` for body rows per the TableCellContext contract.
  const received = stringify(tableMd, {
    partial: true,
    table: {
      cell: ({ tagName }) => (tagName === 'th' ? { 'data-head': 'yes' } : {}),
    },
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th data-head="yes">P</th>
      <th data-head="yes">D</th>
      <th data-head="yes">N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>id</code></td>
      <td>x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('custom Factory hook rebuilds the cell using the context tagName', () => {
  // The hook owns the tag: it builds `th` for the header row and `td` for body
  // rows by reading `tagName` from the context.
  const received = stringify(tableMd, {
    partial: true,
    table: {
      cell:
        ({ tagName }) =>
        (h, props, children) =>
          h(tagName, props, h('span.cell', children)),
    },
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th><span class="cell">P</span></th>
      <th><span class="cell">D</span></th>
      <th><span class="cell">N</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="cell"><code>id</code></span></td>
      <td><span class="cell">x</span></td>
      <td><span class="cell">y</span></td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('factory tag-less shorthand fills in the cell tag (th/td)', () => {
  // `h('.foo')` is a tag-less shorthand (a bare div); the machinery substitutes
  // the cell's own tag, so it becomes a th/td rather than leaking a div.
  const received = stringify(tableMd, {
    partial: true,
    table: {
      cell: () => (h, props, children) => h('.foo', props, ...children),
    },
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th class="foo">P</th>
      <th class="foo">D</th>
      <th class="foo">N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="foo"><code>id</code></td>
      <td class="foo">x</td>
      <td class="foo">y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test("'align-class' selectable via vfm frontmatter", () => {
  const md = [
    '---',
    'vfm:',
    '  table:',
    '    cell: align-class',
    '---',
    '',
    tableMd,
  ].join('\n');
  const received = stringify(md, { partial: true });
  const expected = `
<table>
  <thead>
    <tr>
      <th class="table-align-right">P</th>
      <th class="table-align-center">D</th>
      <th>N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="table-align-right"><code>id</code></td>
      <td class="table-align-center">x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('author raw HTML tables pass through untouched (GFM-generated cells only)', () => {
  // A raw HTML table is an mdast `html` node, not a `table` node, so it never
  // reaches the table handler; `align-class` leaves its cells alone.
  const raw = '<table><tr><td align="right">raw</td></tr></table>';
  const received = stringify(raw, {
    partial: true,
    table: { cell: 'align-class' },
  });
  const expected = `
<table>
  <tbody>
    <tr>
      <td align="right">raw</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});
