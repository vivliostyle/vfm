import type * as hast from 'hast';
import { type Handler as ToHastHandler } from 'mdast-util-to-hast';
import { table as defaultTableHandler } from 'mdast-util-to-hast/lib/handlers/table.js';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';
import { buildElement, type ElementFactory } from '@vivliostyle/internal';

/** Column alignment carried on a GFM table cell. */
export type TableCellAlign = 'left' | 'center' | 'right';

/** Context passed to a {@link TableCellHook} for each table cell. */
export type TableCellContext = {
  /** Tag of the cell. `th` for header-row cells, `td` otherwise. */
  tagName: 'th' | 'td';
  /** Column alignment from the GFM delimiter row; `undefined` if unaligned. */
  align?: TableCellAlign | undefined;
};

/**
 * Factory that rebuilds a `<th>`/`<td>` element. The factory owns the
 * resulting tag, so build with the {@link TableCellContext} `tagName` (e.g.
 * `h(tagName, ...)`) to keep header cells `th` and body cells `td`. A tag-less
 * shorthand selector (`h('.cls', ...)`) fills in the cell's own tag.
 */
export type TableCellFactory = ElementFactory<'th' | 'td', hast.Properties>;

/**
 * Per-cell hook. Called for every `th`/`td`; returns either hast Properties to
 * merge onto the cell or a {@link TableCellFactory} to rebuild it. The original
 * `align` is stripped before the hook runs, so the hook fully owns how (or
 * whether) alignment is expressed.
 */
export type TableCellHook = (
  cell: TableCellContext,
) => hast.Properties | TableCellFactory;

/**
 * Built-in presets for {@link TableCellHook}, selectable by name from
 * declarative surfaces (YAML / CLI).
 *
 * - `'align-attribute'`: emit the HTML4 `align` attribute (identical to
 *   leaving `table.cell` unset; the de-facto default).
 * - `'align-class'`: emit a `table-align-{left|center|right}` class instead,
 *   which is HTML5- / EPUB 3.3-conforming. VFM ships no CSS for it; styling is
 *   the theme's responsibility.
 * - `'align-style'`: emit an inline `style="text-align: {left|center|right}"`
 *   instead, which is HTML5- / EPUB 3.3-conforming and self-contained (renders
 *   aligned with no accompanying CSS).
 *
 * Expressed as `v.union` of `v.literal` (not `v.picklist`) so consumers' schema
 * walkers (e.g. vivliostyle-cli's update-docs) can render it.
 */
export const TableCellPresetSchema = v.union([
  v.literal('align-attribute'),
  v.literal('align-class'),
  v.literal('align-style'),
]);
export type TableCellPreset = v.InferInput<typeof TableCellPresetSchema>;

const cellSchema = v.union([
  TableCellPresetSchema,
  v.pipe(
    v.function() as v.GenericSchema<TableCellHook>,
    v.metadata({ typeString: 'TableCellHook' }),
  ),
]);

const cellDescription =
  "How each GFM table cell (th/td) is emitted: 'align-attribute' (default; " +
  "HTML4 align attribute), 'align-class' (table-align-* class), or " +
  "'align-style' (inline text-align style).";

export const TableOptionsSchema = v.object({
  table: v.optional(
    v.object({
      cell: v.optional(v.pipe(cellSchema, v.description(cellDescription))),
    }),
  ),
});
export type TableOptions = v.InferInput<typeof TableOptionsSchema>;

/**
 * YAML-safe variant of {@link TableOptionsSchema}: `cell` accepts only the
 * string presets, since YAML cannot represent a JavaScript function.
 */
export const YamlTableOptionsSchema = v.object({
  table: v.optional(
    v.object({
      cell: v.optional(
        v.pipe(TableCellPresetSchema, v.description(cellDescription)),
      ),
    }),
  ),
});
export type YamlTableOptions = v.InferInput<typeof YamlTableOptionsSchema>;

const DEFAULT_CELL_POLICY = 'align-attribute' satisfies TableCellPreset;

const resolveCellHook = (
  cell: Exclude<TableCellPreset, typeof DEFAULT_CELL_POLICY> | TableCellHook,
): TableCellHook =>
  typeof cell === 'function'
    ? cell
    : (
        {
          'align-class': ({ align }) =>
            align ? { className: [`table-align-${align}`] } : {},
          'align-style': ({ align }) =>
            align ? { style: `text-align: ${align}` } : {},
        } satisfies Record<
          Exclude<TableCellPreset, typeof DEFAULT_CELL_POLICY>,
          TableCellHook
        >
      )[cell];

const isAlign = (value: hast.Properties[string]): value is TableCellAlign =>
  value === 'left' || value === 'center' || value === 'right';

export const createTableHandler = ({
  table,
}: TableOptions = {}): ToHastHandler => {
  const cell = table?.cell ?? DEFAULT_CELL_POLICY;
  if (cell === DEFAULT_CELL_POLICY) return defaultTableHandler;
  const hook = resolveCellHook(cell);
  return (h, node) => {
    const result = defaultTableHandler(h, node);
    [result]
      .flat()
      .filter((produced) => !!produced)
      .forEach((produced) => {
        visit(produced, 'element', (cell, index, parent) => {
          if (
            parent === null ||
            index === null ||
            (cell.tagName !== 'th' && cell.tagName !== 'td')
          ) {
            return;
          }
          const tagName = cell.tagName;
          const rawAlign = cell.properties?.align;
          const align = isAlign(rawAlign) ? rawAlign : undefined;
          const base = { ...cell.properties };
          delete base.align;
          parent.children[index] = buildElement(
            tagName,
            base,
            cell.children,
            hook({ tagName, align }),
          );
        });
      });
    return result;
  };
};
