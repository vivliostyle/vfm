import { expect, test } from 'vitest';
import { VFM } from '../src/index.js';

// remark-parse 11 has no `Parser.prototype.inlineMethods` to inspect. The
// syntaxes VFM adds are registered as micromark extensions instead; the list
// grows as each syntax is rewritten in #285.

test('registers micromark extensions for the parser', () => {
  const vfm = VFM({ partial: true, math: true }).freeze();
  // remark-gfm, math, ruby, inline footnote, attribute, remark-frontmatter
  expect(vfm.data('micromarkExtensions')).toHaveLength(6);
  expect(vfm.data('fromMarkdownExtensions')).toHaveLength(6);
});

test('does not expose the remark-parse 8 parser class', () => {
  const vfm = VFM({ partial: true, math: true }).freeze();
  expect((vfm as unknown as { Parser?: unknown }).Parser).toBeUndefined();
  expect(typeof vfm.parser).toBe('function');
});
