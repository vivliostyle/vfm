import type * as hast from 'hast';
import { getAttribute as getAttributeHast2 } from 'hast-util-get-attribute';
import { getClassList as getClassListHast2 } from 'hast-util-get-class-list';
import {
  type Handler as ToHastHandler,
  type State as ToHastState,
} from 'mdast-util-to-hast';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';

/**
 * `hast-util-get-attribute` / `hast-util-get-class-list` 1.x are typed against
 * `@types/hast` 2. Their `Readonly<Element>` parameters reject `@types/hast` 3
 * elements under `exactOptionalPropertyTypes` only because of the
 * `| undefined` on `position`; the runtime shape is identical.
 * @todo Drop these casts once the utilities ship `@types/hast` 3 types.
 */
const getAttribute = getAttributeHast2 as unknown as (
  element: hast.Element,
  qualifiedName: string,
) => string | null;
const getClassList = getClassListHast2 as unknown as (
  element: hast.Element,
) => string[];

export type TableCellAlign = 'left' | 'center' | 'right';

export type TableCellContext = {
  node: hast.Element;
  tagName: 'th' | 'td';
  align: TableCellAlign | null;
  properties: hast.Properties;
  children: hast.ElementContent[];
};

/**
 * Hook that rewrites each table cell. Receives the `mdast-util-to-hast`
 * `state` (replaces the `h` of `mdast-util-to-hast` 11) and returns a
 * per-cell transform.
 */
export type TableCellHook = ({
  state,
}: {
  state: ToHastState;
}) => (cell: TableCellContext) => hast.ElementContent[];

export const TableCellHookSchema = v.pipe(
  v.function() as v.GenericSchema<TableCellHook>,
  v.metadata({ typeString: 'TableCellHook' }),
);

/**
 * Preset hook: emit the cell alignment as the HTML4 `align` attribute.
 * @returns Per-cell transform.
 */
export const alignByAttribute: TableCellHook =
  () =>
  ({ node, align, properties, children }) => {
    const outputProperties = { ...properties };
    delete outputProperties.align;
    if (align) outputProperties.align = align;
    return [{ ...node, properties: outputProperties, children }];
  };

/**
 * Preset hook: emit the cell alignment as a `table-align-<align>` class and
 * drop the `align` attribute.
 * @returns Per-cell transform.
 */
export const alignByClass: TableCellHook =
  () =>
  ({ node, align, properties, children }) => {
    const outputProperties = { ...properties };
    delete outputProperties.align;
    if (align) {
      outputProperties.className = [
        ...getClassList({ ...node, properties: outputProperties }),
        `table-align-${align}`,
      ];
    }
    return [{ ...node, properties: outputProperties, children }];
  };

/**
 * Preset hook: emit the cell alignment as `text-align` in the inline `style`
 * (appended to an existing style) and drop the `align` attribute.
 * @returns Per-cell transform.
 */
export const alignByStyle: TableCellHook =
  () =>
  ({ node, align, properties, children }) => {
    const outputProperties = { ...properties };
    delete outputProperties.align;
    if (align) {
      const existingStyle =
        getAttribute(
          { ...node, properties: outputProperties },
          'style',
        )?.replace(/;\s*$/, '') ?? '';
      outputProperties.style = [existingStyle, `text-align: ${align}`]
        .filter(Boolean)
        .join('; ');
    }
    return [{ ...node, properties: outputProperties, children }];
  };

/**
 * Whether a property value is one of the table alignments.
 * @param value - Value of the `align` property.
 * @returns `true` for `left`, `center` or `right`.
 */
const isAlign = (value: hast.Properties[string]): value is TableCellAlign =>
  value === 'left' || value === 'center' || value === 'right';

/**
 * Whether an element is a table cell.
 * @param cell - Element to test.
 * @returns `true` for `th` and `td`.
 */
const isTableCell = (
  cell: hast.Element,
): cell is hast.Element & { tagName: 'th' | 'td' } =>
  cell.tagName === 'th' || cell.tagName === 'td';

/**
 * Wrap a `table` handler so that every `th` / `td` in its output is replaced
 * by what `hook` returns for it. Cells are visited in reverse so splicing does
 * not disturb the indexes of cells not yet visited.
 * @param hook - Per-cell transform factory; receives the to-hast `state`.
 * @returns Function that takes the base `table` handler and returns the
 *   wrapped handler.
 */
export const withTableCellTransform =
  (hook: TableCellHook): ((handler: ToHastHandler) => ToHastHandler) =>
  (handler) =>
  (state, node, parent) => {
    const result = handler(state, node, parent);
    if (result === undefined) return result;

    const resultWasArray = Array.isArray(result);
    const output: hast.Element = {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: resultWasArray ? result : [result],
    };

    const cells: {
      cell: hast.Element & { tagName: 'th' | 'td' };
      index: number;
      parent: hast.Element | hast.Root;
    }[] = [];
    visit(output, 'element', (cell, index, parent) => {
      if (parent === undefined || index === undefined || !isTableCell(cell)) {
        return;
      }
      cells.push({ cell, index, parent });
    });

    const transform = hook({ state });
    for (const { cell, index, parent } of cells.reverse()) {
      const tagName = cell.tagName;
      const rawAlign = cell.properties?.align;
      const align = isAlign(rawAlign) ? rawAlign : null;
      const properties = { ...cell.properties };
      parent.children.splice(
        index,
        1,
        ...transform({
          node: cell,
          tagName,
          align,
          properties,
          children: cell.children,
        }),
      );
    }
    return resultWasArray || output.children.length !== 1
      ? output.children
      : output.children[0];
  };
