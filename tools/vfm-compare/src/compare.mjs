// Run the same Markdown through both VFM generations and compare the HTML.

import { stringify as stringifyCurrent } from '@vivliostyle/vfm';
import { stringify as stringifyNext } from '@vivliostyle/vfm-next';

/**
 * @typedef {import('./corpus.mjs').CorpusEntry} CorpusEntry
 * @typedef {Record<string, unknown>} Options
 * @typedef {'same' | 'whitespace' | 'diff' | 'error'} Status
 */

/**
 * @typedef {object} Result
 * @property {string} id - Entry id.
 * @property {Options} options - Options passed to both `stringify`.
 * @property {Status} status - `same`: identical after whitespace
 *   normalization; `whitespace`: differs only in whitespace; `diff`: differs;
 *   `error`: one side threw (both throwing counts as `same`).
 * @property {string} current - HTML (or error message) of `packages/vfm`.
 * @property {string} next - HTML (or error message) of `packages-next/vfm`.
 * @property {{ current: string, next: string } | undefined} excerpt - Context
 *   around the first difference of the normalized HTML.
 */

/** Every combination the migration issue asks to cover (24 sets). */
export const OPTION_MATRIX = [true, false].flatMap((partial) =>
  [false, true].flatMap((hardLineBreaks) =>
    [true, false].flatMap((math) =>
      ['pandoc', 'dpub', 'gcpm'].map((footnote) => ({
        partial,
        hardLineBreaks,
        math,
        footnote,
      })),
    ),
  ),
);

/** Option set used when `--matrix` is not given. */
export const DEFAULT_OPTIONS = [{ partial: true }];

/**
 * Short label of an option set for the report.
 * @param {Options} options - Option set.
 * @returns {string} Label such as `partial hardLineBreaks footnote=dpub`.
 */
export const labelOf = (options) =>
  Object.entries(options)
    .map(([key, value]) =>
      typeof value === 'boolean'
        ? value
          ? key
          : `!${key}`
        : `${key}=${value}`,
    )
    .join(' ') || 'default';

/**
 * Normalize HTML so that whitespace-only differences disappear: line ending
 * unification, whitespace between tags removed, runs of ASCII whitespace
 * collapsed. Non-ASCII spaces (U+3000, U+00A0) are kept because VFM issues
 * concern them.
 * @param {string} html - HTML.
 * @returns {string} Normalized HTML.
 */
export const normalize = (html) =>
  html
    .replace(/\r\n?/g, '\n')
    .replace(/>[ \t\n]+</g, '><')
    .replace(/[ \t\n]+/g, ' ')
    .trim();

/**
 * Context around the first index where two strings differ.
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @param {number} [context] - Characters to show on each side.
 * @returns {{ current: string, next: string }} Excerpts.
 */
export const excerptOf = (a, b, context = 100) => {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index++;
  /**
   * Cut a window around `index`.
   * @param {string} s - String.
   * @returns {string} Window with ellipses.
   */
  const cut = (s) => {
    const start = Math.max(0, index - context);
    const end = Math.min(s.length, index + context);
    return `${start > 0 ? '…' : ''}${s.slice(start, end)}${end < s.length ? '…' : ''}`;
  };
  return { current: cut(a), next: cut(b) };
};

/**
 * Convert with one generation, turning an exception into a string.
 * @param {(md: string, options: Options) => string} convert - `stringify`.
 * @param {string} markdown - Input.
 * @param {Options} options - Options.
 * @returns {{ html: string, error: boolean }} Output.
 */
const attempt = (convert, markdown, options) => {
  try {
    return { html: convert(markdown, options), error: false };
  } catch (e) {
    return {
      html: `[error] ${e instanceof Error ? e.message : String(e)}`,
      error: true,
    };
  }
};

/**
 * Compare one input under one option set.
 * @param {CorpusEntry} entry - Input.
 * @param {Options} options - Options.
 * @returns {Result} Result.
 */
export const compare = (entry, options) => {
  const current = attempt(stringifyCurrent, entry.markdown, options);
  const next = attempt(stringifyNext, entry.markdown, options);
  /** @type {Status} */
  let status;
  if (current.error !== next.error) {
    status = 'error';
  } else if (current.error) {
    status = current.html === next.html ? 'same' : 'error';
  } else if (current.html === next.html) {
    status = 'same';
  } else if (normalize(current.html) === normalize(next.html)) {
    status = 'whitespace';
  } else {
    status = 'diff';
  }
  return {
    id: entry.id,
    options,
    status,
    current: current.html,
    next: next.html,
    excerpt:
      status === 'diff' || status === 'error'
        ? excerptOf(normalize(current.html), normalize(next.html))
        : undefined,
  };
};

/**
 * Compare every input under every option set.
 * @param {CorpusEntry[]} entries - Inputs.
 * @param {Options[]} optionSets - Option sets.
 * @returns {Result[]} Results, grouped by input.
 */
export const compareAll = (entries, optionSets) =>
  entries.flatMap((entry) =>
    optionSets.map((options) => compare(entry, options)),
  );
