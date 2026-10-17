#!/usr/bin/env node
/* eslint-disable no-console -- CLI entry point */
// Usage:
//   pnpm --filter ./tools/vfm-compare compare -- [--tests] [--docs] [--md <path>]...
//       [--matrix | --options '<json>'] [--out report.md] [--json results.json]
// Without a corpus flag the test inputs and the documentation samples are used.
// Both `packages/vfm` and `packages-next/vfm` must be built (`pnpm build`).

import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { compareAll, DEFAULT_OPTIONS, OPTION_MATRIX } from './compare.mjs';
import {
  dedupe,
  fromDocument,
  fromMarkdownFiles,
  fromPackageTests,
} from './corpus.mjs';
import { buildReport } from './report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const { values } = parseArgs({
  options: {
    tests: { type: 'boolean', default: false },
    docs: { type: 'boolean', default: false },
    md: { type: 'string', multiple: true, default: [] },
    matrix: { type: 'boolean', default: false },
    options: { type: 'string' },
    out: { type: 'string' },
    json: { type: 'string' },
  },
});

const useDefaults = !values.tests && !values.docs && values.md.length === 0;
/** @type {import('./corpus.mjs').CorpusEntry[]} */
let entries = [];
/** @type {string[]} */
const sources = [];
if (values.tests || useDefaults) {
  entries.push(...fromPackageTests(root));
  sources.push('packages/*/tests');
}
if (values.docs || useDefaults) {
  for (const doc of ['docs/vfm.md', 'docs/ja/vfm.md']) {
    entries.push(...fromDocument(join(root, doc), root));
  }
  sources.push('docs/vfm.md', 'docs/ja/vfm.md');
}
if (values.md.length > 0) {
  entries.push(...fromMarkdownFiles(values.md.map((p) => resolve(p))));
  sources.push(...values.md);
}
entries = dedupe(entries);

const optionSets = values.matrix
  ? OPTION_MATRIX
  : values.options
    ? [JSON.parse(values.options)]
    : DEFAULT_OPTIONS;

const results = compareAll(entries, optionSets);
const report = buildReport(entries, optionSets, results, sources);

if (values.json) {
  writeFileSync(values.json, JSON.stringify({ entries, results }, null, 2));
}
if (values.out) {
  writeFileSync(values.out, report);
  const diffs = new Set(
    results
      .filter((r) => r.status === 'diff' || r.status === 'error')
      .map((r) => r.id),
  );
  console.log(
    `${entries.length} inputs × ${optionSets.length} option sets; ${diffs.size} inputs differ. Report: ${values.out}`,
  );
} else {
  console.log(report);
}
