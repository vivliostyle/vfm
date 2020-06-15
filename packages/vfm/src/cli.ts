#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';
import meow from 'meow';
import {stringify} from '.';

const cli = meow(
  `
    Usage
      $ vfm <filename>
      $ echo <string> | vfm
 
    Options
      --partial, -r  Output markdown fragments
      --stylesheet   Custom stylesheet path/URL
 
    Examples
      $ vfm input.md
`,
  {
    flags: {
      partial: {
        type: 'boolean',
        alias: 'p',
      },
      stylesheet: {
        type: 'string',
      },
    },
  },
);

function convert(
  input: string,
  flags: meow.TypedFlags<{
    partial: {type: 'boolean'; alias: string};
    stylesheet: {type: 'string'; alias: string};
  }> & {
    [name: string]: unknown;
  },
) {
  return stringify(input, {
    partial: flags.partial,
    stylesheet: flags.stylesheet,
  });
}

function main() {
  try {
    const filepath = cli.input[0];

    if (filepath) {
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
      console.log(convert(line, cli.flags));
    });
  } catch (err) {
    console.log(err.message);
  }
}

main();
