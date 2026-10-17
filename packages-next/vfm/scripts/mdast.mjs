#!/usr/bin/env node
/* eslint-disable no-console -- CLI script that prints its result */
// Print the MDAST (and optionally the HTML) of a Markdown input in the form
// the test helpers in `tests/utils.ts` compare against: `unist-util-inspect`
// without colors, with position information and `data` lines removed. Use it
// to regenerate the expected values of `buildProcessorTestingCode` when the
// parser output changes on purpose.
//
// Usage (after `pnpm build`):
//   node scripts/mdast.mjs [--options '{"math":true}'] [--html] <markdown | ->
//   echo '# h' | node scripts/mdast.mjs --html
//
// Options are the `StringifyMarkdownOptions` of `VFM()`; `partial: true`,
// `disableFormatHtml: true` and `math: false` are the defaults, as in the
// test helpers.

import { readFileSync } from 'node:fs';
import { inspectNoColor } from 'unist-util-inspect';
import { VFM } from '../lib/index.js';

const args = process.argv.slice(2);
let options = {};
const optionsAt = args.indexOf('--options');
if (optionsAt !== -1) {
  options = JSON.parse(args[optionsAt + 1] ?? '{}');
  args.splice(optionsAt, 2);
}
const htmlAt = args.indexOf('--html');
const withHtml = htmlAt !== -1;
if (withHtml) args.splice(htmlAt, 1);

const input =
  args.length === 0 || args[0] === '-'
    ? readFileSync(0, 'utf8')
    : args.join(' ');

const vfm = VFM({
  partial: true,
  disableFormatHtml: true,
  math: false,
  ...options,
}).freeze();

console.log(
  inspectNoColor(vfm.parse(input))
    .replace(/ \(.+?\)$/gm, '')
    .replace(/\n +data: .+/gm, ''),
);
if (withHtml) {
  console.log('---');
  console.log(String(vfm.processSync(input)));
}
