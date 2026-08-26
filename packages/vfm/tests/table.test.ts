import { expect, test } from 'vitest';
import * as v from 'valibot';
import {
  stringify,
  TableCellHookSchema,
  TableOptionsSchema,
} from '../src/index.js';
import { resolveTableCellHook } from '../src/plugins/table.js';
import { alignByAttribute } from '@vivliostyle/mdast-to-hast-table-cell';

const tableMd = ['| A |', '| :-: |', '| x |'].join('\n');

test('resolves an omitted table cell option to alignByAttribute', () => {
  expect(resolveTableCellHook()).toBe(alignByAttribute);
});

test('exports TableOptionsSchema', () => {
  expect(
    v.parse(TableOptionsSchema, { table: { cell: 'align-style' } }),
  ).toEqual({ table: { cell: 'align-style' } });
});

test('exports the VFM table cell hook schema', () => {
  const hook = () => ({});
  expect(v.parse(TableCellHookSchema, hook)).toBe(hook);
});

test('applies table cell alignment output through the programmatic API', () => {
  const received = stringify(tableMd, {
    partial: true,
    table: { cell: 'align-style' },
  });
  expect(received).toContain('<th style="text-align: center">A</th>');
  expect(received).toContain('<td style="text-align: center">x</td>');
});

test('applies table cell alignment output through frontmatter', () => {
  const markdown = [
    '---',
    'vfm:',
    '  table:',
    '    cell: align-class',
    '---',
    '',
    tableMd,
  ].join('\n');
  const received = stringify(markdown, { partial: true });
  expect(received).toContain('<th class="table-align-center">A</th>');
  expect(received).toContain('<td class="table-align-center">x</td>');
});

test('applies a table cell function handler through VFM', () => {
  const received = stringify(tableMd, {
    partial: true,
    table: {
      cell: ({ align }) => (align ? { 'data-align': align } : {}),
    },
  });
  expect(received).toContain('<th data-align="center">A</th>');
  expect(received).toContain('<td data-align="center">x</td>');
});

test('passes undefined to VFM hooks for unaligned cells', () => {
  const markdown = ['| A | B |', '| :-: | --- |', '| x | y |'].join('\n');
  const received = stringify(markdown, {
    partial: true,
    table: {
      cell: ({ align }) =>
        align === undefined ? { 'data-unaligned': 'yes' } : {},
    },
  });
  expect(received).toContain('<th data-unaligned="yes">B</th>');
  expect(received).toContain('<td data-unaligned="yes">y</td>');
});

test('adapts a table cell factory through VFM', () => {
  const received = stringify(tableMd, {
    partial: true,
    table: {
      cell:
        ({ tagName }) =>
        (h, properties, children) =>
          h(tagName, properties, h('span.cell', children)),
    },
  });
  expect(received).toContain('<th><span class="cell">A</span></th>');
  expect(received).toContain('<td><span class="cell">x</span></td>');
});
