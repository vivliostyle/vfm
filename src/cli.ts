#!/usr/bin/env node

import fs from 'fs';
import meow from 'meow';
import readline from 'readline';
import { stringify } from '.';

const cli = meow(
  `
    Usage
      $ vfm <filename>
      $ echo <string> | vfm
 
    Options
      --style, -s    Custom stylesheet path/URL
      --partial, -r  Output markdown fragments
      --title        Document title (ignored in partial mode)
      --language     Document language (ignored in partial mode)
 
    Examples
      $ vfm input.md
`,
  {
    flags: {
      style: {
        type: 'string',
        alias: 's',
        isMultiple: true,
      },
      partial: {
        type: 'boolean',
        alias: 'p',
      },
      title: {
        type: 'string',
      },
      language: {
        type: 'string',
      },
    },
  },
);

function convert(
  input: string,
  flags: meow.TypedFlags<{
    style: { type: 'string'; alias: string };
    partial: { type: 'boolean'; alias: string };
    title: { type: 'string' };
    language: { type: 'string' };
  }>,
) {
  return stringify(input, {
    partial: flags.partial,
    style: flags.style,
    title: flags.title,
    language: flags.language,
  });
}

function main(
  cli: meow.Result<{
    style: { type: 'string'; alias: string };
    partial: { type: 'boolean'; alias: string };
    title: { type: 'string' };
    language: { type: 'string' };
  }>,
) {
  try {
    const filepath = cli.input[0];

    if (filepath) {
      // eslint-disable-next-line no-console
      return console.log(
        convert(fs.readFileSync(filepath).toString(), cli.flags),
      );
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    rl.on('line', function (line) {
      // eslint-disable-next-line no-console
      console.log(convert(line, cli.flags));
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err.message);
  }
}

main(cli);
