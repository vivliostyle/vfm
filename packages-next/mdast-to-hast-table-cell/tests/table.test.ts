import { expect, test } from 'vitest';
import { alignByAttribute, alignByClass, alignByStyle } from '../src/index.js';
import { stringify } from './utils.js';

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

test('alignByAttribute is identical to the default', () => {
  expect(stringify(tableMd, { partial: true, cell: alignByAttribute })).toBe(
    stringify(tableMd, { partial: true }),
  );
});

test('alignByClass emits table-align-* classes and drops align', () => {
  const received = stringify(tableMd, {
    partial: true,
    cell: alignByClass,
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

test('alignByStyle emits inline text-align style and drops align', () => {
  const received = stringify(tableMd, {
    partial: true,
    cell: alignByStyle,
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th style="text-align: right">P</th>
      <th style="text-align: center">D</th>
      <th>N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: right"><code>id</code></td>
      <td style="text-align: center">x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('custom hook receives align in both context and properties', () => {
  const received = stringify(tableMd, {
    partial: true,
    cell:
      ({ h }) =>
      ({ tagName, align, properties, children }) => [
        h(
          null,
          tagName,
          align
            ? {
                ...properties,
                'data-align': align,
                'data-property-align': properties.align,
              }
            : properties,
          children,
        ),
      ],
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th align="right" data-align="right" data-property-align="right">P</th>
      <th align="center" data-align="center" data-property-align="center">D</th>
      <th>N</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="right" data-align="right" data-property-align="right"><code>id</code></td>
      <td align="center" data-align="center" data-property-align="center">x</td>
      <td>y</td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('custom hook can branch on tagName (th for header, td for body)', () => {
  const received = stringify(tableMd, {
    partial: true,
    cell:
      ({ h }) =>
      ({ tagName, properties, children }) => [
        h(
          null,
          tagName,
          tagName === 'th' ? { ...properties, 'data-head': 'yes' } : properties,
          children,
        ),
      ],
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th align="right" data-head="yes">P</th>
      <th align="center" data-head="yes">D</th>
      <th data-head="yes">N</th>
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

test('custom hook can rebuild the cell and its children', () => {
  const received = stringify(tableMd, {
    partial: true,
    cell:
      ({ h }) =>
      ({ tagName, properties, children }) => [
        h(null, tagName, properties, [
          h(null, 'span', { className: ['cell'] }, children),
        ]),
      ],
  });
  const expected = `
<table>
  <thead>
    <tr>
      <th align="right"><span class="cell">P</span></th>
      <th align="center"><span class="cell">D</span></th>
      <th><span class="cell">N</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="right"><span class="cell"><code>id</code></span></td>
      <td align="center"><span class="cell">x</span></td>
      <td><span class="cell">y</span></td>
    </tr>
  </tbody>
</table>
`;
  expect(received).toBe(expected);
});

test('custom hook can omit cells', () => {
  const received = stringify(tableMd, {
    partial: true,
    cell: () => () => [],
  });
  expect(received).not.toMatch(/<th(?:\s|>)/);
  expect(received).not.toMatch(/<td(?:\s|>)/);
});

test('author raw HTML tables pass through untouched (GFM-generated cells only)', () => {
  // A raw HTML table is an mdast `html` node, not a `table` node, so it never
  // reaches the table handler; `align-class` leaves its cells alone.
  const raw = '<table><tr><td align="right">raw</td></tr></table>';
  const received = stringify(raw, {
    partial: true,
    cell: alignByClass,
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
