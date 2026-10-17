import type * as hast from 'hast';
import {
  defaultHandlers,
  type Handler as ToHastHandler,
} from 'mdast-util-to-hast';
import format from 'rehype-format';
import raw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import {
  alignByAttribute,
  type TableCellHook,
  withTableCellTransform,
} from '../src/index.js';

export const defaultTableHandler: ToHastHandler = defaultHandlers.table;

/** Build a hast element (stand-in for the `h` of mdast-util-to-hast 11). */
export const el = (
  tagName: string,
  properties: hast.Properties,
  children: hast.ElementContent[],
): hast.Element => ({ type: 'element', tagName, properties, children });

type StringifyOptions = {
  cell?: TableCellHook;
  partial?: boolean;
  tableHandler?: ToHastHandler;
};

/**
 * Render Markdown to HTML through remark-gfm and remark-rehype with the
 * `table` handler wrapped by `withTableCellTransform`.
 * @param markdown - Markdown source.
 * @param options - Cell hook (default `alignByAttribute`) and base `table`
 *   handler (default `defaultHandlers.table`).
 * @returns Formatted HTML.
 */
export const stringify = (
  markdown: string,
  options: StringifyOptions = {},
): string =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use([
        [
          remarkRehype,
          {
            allowDangerousHtml: true,
            handlers: {
              table: withTableCellTransform(options.cell ?? alignByAttribute)(
                options.tableHandler ?? defaultTableHandler,
              ),
            },
          },
        ],
      ])
      .use(raw)
      .use(format)
      .use(rehypeStringify)
      .processSync(markdown),
  );
