import { table as defaultTableHandler } from 'mdast-util-to-hast/lib/handlers/table.js';
import type { Handler as ToHastHandler } from 'mdast-util-to-hast';
import format from 'rehype-format';
import raw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';
import {
  alignByAttribute,
  type TableCellHook,
  withTableCellTransform,
} from '../src/index.js';

type StringifyOptions = {
  cell?: TableCellHook;
  partial?: boolean;
  tableHandler?: ToHastHandler;
};

export const stringify = (
  markdown: string,
  options: StringifyOptions = {},
): string =>
  String(
    unified()
      .use(remarkParse, { gfm: true, commonmark: true })
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
