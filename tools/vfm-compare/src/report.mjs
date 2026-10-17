// Markdown report of the comparison results.

import { labelOf } from './compare.mjs';

/**
 * @typedef {import('./compare.mjs').Result} Result
 * @typedef {import('./corpus.mjs').CorpusEntry} CorpusEntry
 */

/**
 * Wrap text in a fenced code block, truncated to `maxLines`.
 * @param {string} text - Content.
 * @param {string} lang - Fence language.
 * @param {number} [maxLines] - Maximum lines to keep.
 * @returns {string} Fenced block.
 */
const fence = (text, lang, maxLines = 30) => {
  const lines = text.replace(/\n$/, '').split('\n');
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines)
    shown.push(`… (${lines.length - maxLines} more lines)`);
  const marker = '`'.repeat(
    Math.max(3, ...shown.map((l) => (/^`+/.exec(l) ?? [''])[0].length + 1)),
  );
  return `${marker}${lang}\n${shown.join('\n')}\n${marker}`;
};

/**
 * Escape a string for a Markdown table cell.
 * @param {string} s - Text.
 * @returns {string} Escaped text.
 */
const cell = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/**
 * Build the Markdown report.
 * @param {CorpusEntry[]} entries - Inputs that were compared.
 * @param {Record<string, unknown>[]} optionSets - Option sets.
 * @param {Result[]} results - Comparison results.
 * @param {string[]} sources - Human-readable corpus description.
 * @returns {string} Markdown.
 */
export const buildReport = (entries, optionSets, results, sources) => {
  const out = [];
  out.push('# VFM output comparison: packages/vfm vs packages-next/vfm', '');
  out.push(`- date: ${new Date().toISOString().slice(0, 10)}`);
  out.push(`- corpus: ${entries.length} inputs (${sources.join(', ')})`);
  out.push(`- option sets: ${optionSets.length}`);
  out.push('');

  out.push('## Summary', '');
  out.push('| option set | same | whitespace only | diff | error |');
  out.push('| --- | ---: | ---: | ---: | ---: |');
  for (const options of optionSets) {
    const rows = results.filter((r) => r.options === options);
    /**
     * Count results with a status.
     * @param {Result['status']} status - Status.
     * @returns {number} Count.
     */
    const count = (status) => rows.filter((r) => r.status === status).length;
    out.push(
      `| ${cell(labelOf(options))} | ${count('same')} | ${count('whitespace')} | ${count('diff')} | ${count('error')} |`,
    );
  }
  out.push('');

  const byInput = new Map();
  for (const result of results) {
    if (result.status !== 'diff' && result.status !== 'error') continue;
    const group = byInput.get(result.id) ?? [];
    group.push(result);
    byInput.set(result.id, group);
  }
  out.push(`## Differences (${byInput.size} inputs)`, '');
  for (const [id, group] of byInput) {
    const entry = entries.find((e) => e.id === id);
    const first = group[0];
    const sets =
      group.length === optionSets.length
        ? `all ${optionSets.length} option sets`
        : group.map((r) => `\`${labelOf(r.options)}\``).join(', ');
    out.push(`### ${id}`, '');
    out.push(`- status: ${first.status}; differs under ${sets}`);
    out.push('- input:', '');
    out.push(fence(entry?.markdown ?? '', 'md'), '');
    out.push(`- current: \`${cell(first.excerpt?.current ?? '')}\``);
    out.push(`- next: \`${cell(first.excerpt?.next ?? '')}\``);
    out.push('');
  }
  return out.join('\n');
};
