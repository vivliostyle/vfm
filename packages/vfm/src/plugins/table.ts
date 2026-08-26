import type * as hast from 'hast';
import * as v from 'valibot';
import {
  alignByAttribute,
  alignByClass,
  alignByStyle,
  type TableCellHook as RemarkTableCellHook,
} from '@vivliostyle/mdast-to-hast-table-cell';
import {
  buildElement,
  type ElementFactory,
} from '@vivliostyle/vfm-internal-utils';

export const TableCellPresetSchema = v.union([
  v.literal('align-attribute'),
  v.literal('align-class'),
  v.literal('align-style'),
]);
export type TableCellPreset = v.InferInput<typeof TableCellPresetSchema>;

export type TableCellAlign = 'left' | 'center' | 'right';
export type TableCellContext = {
  tagName: 'th' | 'td';
  align?: TableCellAlign | undefined;
};
export type TableCellFactory = ElementFactory<'th' | 'td', hast.Properties>;
export type TableCellHook = (
  cell: TableCellContext,
) => hast.Properties | TableCellFactory;

export const TableCellHookSchema = v.pipe(
  v.function() as v.GenericSchema<TableCellHook>,
  v.metadata({ typeString: 'TableCellHook' }),
);

export const TableCellOptionSchema = v.union([
  TableCellPresetSchema,
  TableCellHookSchema,
]);
export type TableCellOption = v.InferInput<typeof TableCellOptionSchema>;

const tableCellPresetHooks = {
  'align-attribute': alignByAttribute,
  'align-class': alignByClass,
  'align-style': alignByStyle,
} satisfies Record<TableCellPreset, RemarkTableCellHook>;

const adaptTableCellHook =
  (hook: TableCellHook): RemarkTableCellHook =>
  () =>
  ({ tagName, align, properties, children }) => {
    const outputProperties = { ...properties };
    delete outputProperties.align;
    return [
      buildElement(
        tagName,
        outputProperties,
        children,
        hook({ tagName, align: align ?? undefined }),
      ),
    ];
  };

export const resolveTableCellHook = (
  cell: TableCellOption = 'align-attribute',
): RemarkTableCellHook =>
  typeof cell === 'function'
    ? adaptTableCellHook(cell)
    : tableCellPresetHooks[cell];

const cellDescription =
  "How each GFM table cell (th/td) is emitted: 'align-attribute' (default; " +
  "HTML4 align attribute), 'align-class' (table-align-* class), or " +
  "'align-style' (inline text-align style).";

export const TableOptionsSchema = v.object({
  table: v.optional(
    v.object({
      cell: v.optional(
        v.pipe(TableCellOptionSchema, v.description(cellDescription)),
      ),
    }),
  ),
});
export type TableOptions = v.InferInput<typeof TableOptionsSchema>;

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
