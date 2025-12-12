#!/usr/bin/env node

import fs from 'fs';
import meow, { Result } from 'meow';
import readline from 'readline';
import { stringify } from './index.js';

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
    },
  },
);

function compile(input: string) {
  // eslint-disable-next-line no-console
  console.log(
    stringify(input, {
      partial: cli.flags.partial,
      style: cli.flags.style,
      title: cli.flags.title,
      language: cli.flags.language,
      hardLineBreaks: cli.flags.hardLineBreaks,
      disableFormatHtml: cli.flags.disableFormatHtml,
      math: cli.flags.disableMath === undefined ? true : !cli.flags.disableMath,
      imgFigcaptionOrder: cli.flags.imgFigcaptionOrder as
        | 'img-figcaption'
        | 'figcaption-img'
        | undefined,
    }),
  );
}

function main(
  cli: Result<{
    style: { type: 'string'; shortFlag: string };
    partial: { type: 'boolean'; shortFlag: string };
    title: { type: 'string' };
    language: { type: 'string' };
    hardLineBreaks: { type: 'boolean' };
    disableFormatHtml: { type: 'boolean' };
    disableMath: { type: 'boolean' };
    imgFigcaptionOrder: { type: 'string' };
  }>,
) {
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
