#!/usr/bin/env node

import fs from 'fs';
import meow from 'meow';
import readline from 'readline';
import * as v from 'valibot';
import { stringify, StringifyMarkdownOptionsSchema } from './index.js';

const cli = meow(
  `
    Usage
      $ vfm <filename>
      $ echo <string> | vfm

    Options
      --style, -s                  Custom stylesheet path/URL
      --partial, -p                Output markdown fragments
      --title                      Document title (ignored in partial mode)
      --language                   Document language (ignored in partial mode)
      --hard-line-breaks           Add <br> at the position of hard line breaks, without needing spaces
      --disable-format-html        Disable automatic HTML format
      --disable-math               Disable math syntax
      --img-figcaption-order       Order of img and figcaption elements in figure (img-figcaption or figcaption-img)
      --assign-id-to-figcaption    Assign ID to figcaption instead of img/code
      --captionless-image-policy   How to render an empty-alt image (paragraph, figure, or figure-with-figcaption)
      --footnote                   Footnote output mode (pandoc, dpub, or gcpm)
      --table-cell                 How each table cell is emitted (align-attribute, align-class, or align-style)
      --rewrite-relative-href-extensions   Rewrite relative document href extensions to .html (repeatable, e.g. md)

    Examples
      $ vfm input.md
`,
  {
    importMeta: import.meta,
    flags: {
      style: {
        type: 'string',
        shortFlag: 's',
        isMultiple: true,
      },
      partial: {
        type: 'boolean',
        shortFlag: 'p',
      },
      title: {
        type: 'string',
      },
      language: {
        type: 'string',
      },
      hardLineBreaks: {
        type: 'boolean',
      },
      disableFormatHtml: {
        type: 'boolean',
      },
      disableMath: {
        type: 'boolean',
      },
      imgFigcaptionOrder: {
        type: 'string',
        choices: ['img-figcaption', 'figcaption-img'],
      },
      assignIdToFigcaption: {
        type: 'boolean',
      },
      captionlessImagePolicy: {
        type: 'string',
        choices: ['paragraph', 'figure', 'figure-with-figcaption'],
      },
      footnote: {
        type: 'string',
        choices: ['pandoc', 'dpub', 'gcpm'],
      },
      tableCell: {
        type: 'string',
        choices: ['align-attribute', 'align-class', 'align-style'],
      },
      rewriteRelativeHrefExtensions: {
        type: 'string',
        isMultiple: true,
      },
    },
  },
);

function compile(input: string) {
  // meow keeps `imgFigcaptionOrder`, `captionlessImagePolicy`, `footnote`, and
  // `tableCell` typed as plain `string`, so `v.parse` is needed to narrow them
  // to their literal unions.
  const options = v.parse(StringifyMarkdownOptionsSchema, {
    partial: cli.flags.partial,
    style: cli.flags.style,
    title: cli.flags.title,
    language: cli.flags.language,
    hardLineBreaks: cli.flags.hardLineBreaks,
    disableFormatHtml: cli.flags.disableFormatHtml,
    math: cli.flags.disableMath === undefined ? true : !cli.flags.disableMath,
    imgFigcaptionOrder: cli.flags.imgFigcaptionOrder,
    assignIdToFigcaption: cli.flags.assignIdToFigcaption,
    captionlessImagePolicy: cli.flags.captionlessImagePolicy,
    footnote: cli.flags.footnote,
    table: cli.flags.tableCell ? { cell: cli.flags.tableCell } : undefined,
    rewriteRelativeHrefExtensions: cli.flags.rewriteRelativeHrefExtensions,
  });
  // eslint-disable-next-line no-console
  console.log(stringify(input, options));
}

type Cli = typeof cli;

function main(cli: Cli) {
  try {
    const filepath = cli.input[0];

    if (filepath) {
      return compile(fs.readFileSync(filepath).toString());
    }

    let buffer = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('pause', () => {
      compile(buffer);
      buffer = '';
    });

    rl.on('line', (line) => {
      if (line === 'EOD') {
        compile(buffer);
        buffer = '';
        return;
      }
      buffer += line + '\n';
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
}

main(cli);
