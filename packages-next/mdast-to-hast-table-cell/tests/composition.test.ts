import type { Handler as ToHastHandler } from 'mdast-util-to-hast';
import { table as defaultTableHandler } from 'mdast-util-to-hast/lib/handlers/table.js';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';
import { expect, test } from 'vitest';
import {
  alignByAttribute,
  alignByClass,
  alignByStyle,
  TableCellHookSchema,
  withTableCellTransform,
} from '../src/index.js';
import { stringify } from './utils.js';

const baseTableHandler: ToHastHandler = defaultTableHandler;

test('provides the table cell hook schema', () => {
  expect(v.parse(TableCellHookSchema, alignByStyle)).toBe(alignByStyle);
  expect(() => v.parse(TableCellHookSchema, 'align-style')).toThrow();
});

test('enhances the supplied handler with a function hook', () => {
  const handler = (() => undefined) as ToHastHandler;
  expect(withTableCellTransform(alignByStyle)(handler)).not.toBe(handler);
});

test('passes the generated cell node and preserves its position', () => {
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  let transformedCells = 0;
  stringify(markdown, {
    cell: ({ h }) => {
      const transform = alignByStyle({ h });
      return (cell) => {
        const output = transform(cell);
        expect(output[0]?.position).toEqual(cell.node.position);
        transformedCells += 1;
        return output;
      };
    },
  });
  expect(transformedCells).toBe(2);
});

test('enhances the output of a supplied table handler', () => {
  const handler: ToHastHandler = (h, node, parent) => {
    const result = baseTableHandler(h, node, parent);
    [result]
      .flat()
      .filter((produced) => !!produced)
      .forEach((produced) => {
        visit(produced, 'element', (element) => {
          if (element.tagName !== 'table') return;
          (element.properties ??= {}).dataSource = 'supplied-handler';
        });
      });
    return result;
  };
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  const received = stringify(markdown, {
    cell: alignByStyle,
    tableHandler: handler,
  });
  expect(received).toContain('<table data-source="supplied-handler">');
  expect(received).toContain('<td style="text-align: center">x</td>');
});

test.each([
  [alignByClass, 'class="existing table-align-center" style="color: red"'],
  [alignByStyle, 'class="existing" style="color: red; text-align: center"'],
])('preserves properties emitted by the supplied handler', (cell, expected) => {
  const handler: ToHastHandler = (h, node, parent) => {
    const result = baseTableHandler(h, node, parent);
    [result]
      .flat()
      .filter((produced) => !!produced)
      .forEach((produced) => {
        visit(produced, 'element', (element) => {
          if (element.tagName !== 'th' && element.tagName !== 'td') return;
          element.properties = {
            ...element.properties,
            className: ['existing'],
            style: 'color: red',
          };
        });
      });
    return result;
  };
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  const received = stringify(markdown, { cell, tableHandler: handler });
  expect(received).toContain(`<td ${expected}>x</td>`);
});

test.each([
  [alignByClass, 'class="0 existing table-align-center" style="0"'],
  [alignByStyle, 'class="0 existing" style="0; text-align: center"'],
])('stringifies arbitrary property values', (cell, expected) => {
  const handler: ToHastHandler = (h, node, parent) => {
    const result = baseTableHandler(h, node, parent);
    [result]
      .flat()
      .filter((produced) => !!produced)
      .forEach((produced) => {
        visit(produced, 'element', (element) => {
          if (element.tagName !== 'th' && element.tagName !== 'td') return;
          element.properties = {
            ...element.properties,
            className: [0, 'existing'],
            style: 0,
          };
        });
      });
    return result;
  };
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  const received = stringify(markdown, { cell, tableHandler: handler });
  expect(received).toContain(`<td ${expected}>x</td>`);
});

test('preserves className tokens', () => {
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  let transformedCells = 0;
  stringify(markdown, {
    cell: ({ h }) => {
      const transform = alignByClass({ h });
      return (cell) => {
        const output = transform({
          ...cell,
          properties: {
            ...cell.properties,
            className: ['a', 'b'],
          },
        });
        const transformed = output[0];
        expect(transformed?.type).toBe('element');
        if (transformed?.type !== 'element') return output;
        expect(transformed.properties?.className).toEqual([
          'a',
          'b',
          'table-align-center',
        ]);
        transformedCells += 1;
        return output;
      };
    },
  });
  expect(transformedCells).toBe(2);
});

test.each([
  [alignByAttribute, 'align="center"'],
  [alignByClass, 'class="table-align-center"'],
  [alignByStyle, 'style="text-align: center"'],
])('does not reinterpret hast node data', (cell, expected) => {
  const handler: ToHastHandler = (h, node, parent) => {
    const result = baseTableHandler(h, node, parent);
    [result]
      .flat()
      .filter((produced) => !!produced)
      .forEach((produced) => {
        visit(produced, 'element', (element) => {
          if (element.tagName !== 'th' && element.tagName !== 'td') return;
          element.data = {
            hName: 'div',
            hProperties: { className: ['from-data'] },
            hChildren: [{ type: 'text', value: 'replaced' }],
          };
        });
      });
    return result;
  };
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  const received = stringify(markdown, { cell, tableHandler: handler });
  expect(received).toContain(`<td ${expected}>x</td>`);
  expect(received).not.toContain('from-data');
  expect(received).not.toContain('replaced');
});

test('transforms a cell returned at the top level', () => {
  const handler = (() => ({
    type: 'element',
    tagName: 'td',
    properties: { align: 'center', className: ['existing'] },
    children: [{ type: 'text', value: 'x' }],
  })) as ToHastHandler;
  const result = withTableCellTransform(alignByClass)(handler)(
    undefined as never,
    undefined,
    null,
  );
  expect(result).toEqual({
    type: 'element',
    tagName: 'td',
    properties: {
      className: ['existing', 'table-align-center'],
    },
    children: [{ type: 'text', value: 'x' }],
  });
});

test('accepts a function handler as the customization foundation', () => {
  const markdown = ['| A |', '| :-: |', '| x |'].join('\n');
  const received = stringify(markdown, {
    cell:
      ({ h }) =>
      ({ tagName, align, properties, children }) => [
        h(
          null,
          tagName,
          {
            ...properties,
            className: [`${tagName}-${align ?? 'none'}`],
          },
          children,
        ),
      ],
  });
  expect(received).toContain('<th align="center" class="th-center">A</th>');
  expect(received).toContain('<td align="center" class="td-center">x</td>');
});
