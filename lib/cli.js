#!/usr/bin/env node
'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
var fs_1 = __importDefault(require('fs'));
var readline_1 = __importDefault(require('readline'));
var meow_1 = __importDefault(require('meow'));
var _1 = require('.');
var cli = meow_1.default(
  '\n    Usage\n      $ vfm <filename>\n      $ echo <string> | vfm\n \n    Options\n      --partial, -r  Output markdown fragments\n      --stylesheet   Custom stylesheet path/URL\n \n    Examples\n      $ vfm input.md\n',
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
function convert(input, flags) {
  return _1.stringify(input, {
    partial: flags.partial,
    stylesheet: flags.stylesheet,
  });
}
function main() {
  try {
    var filepath = cli.input[0];
    if (filepath) {
      return console.log(
        convert(fs_1.default.readFileSync(filepath).toString(), cli.flags),
      );
    }
    var rl = readline_1.default.createInterface({
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
