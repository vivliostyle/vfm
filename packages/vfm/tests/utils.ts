import { expect } from 'vitest';
import { inspectNoColor as unistInspectNoColor } from 'unist-util-inspect';
import { type StringifyMarkdownOptions, VFM } from '../src/index.js';

/**
 * Utility for testing MDAST and HTML strings generated from Markdown.
 * @param input Markdown string.
 * @param expectedMdast Expected MDAST string.
 * @param expectedHtml Expected HTML string.
 * @param options Option for convert Markdown to VFM (HTML).
 */
export const buildProcessorTestingCode =
  (
    input: string,
    expectedMdast: string,
    expectedHtml: string,
    {
      partial = true,
      disableFormatHtml = true,
      math = false,
      ...rest
    }: StringifyMarkdownOptions = {},
  ) =>
  (): any => {
    const vfm = VFM({ partial, disableFormatHtml, math, ...rest }).freeze();
    const R = / \(.+?\)$/gm; // Remove position information
    // Remove data field from MDAST comparison.
    // The data field is not part of the MDAST structure itself, but is used for
    // coordination with subsequent processing (e.g., hProperties for HAST conversion).
    // Therefore, validating the final HTML output is sufficient to confirm that the data
    // was applied correctly.
    const D = /\n +data: .+/gm;
    expect(
      unistInspectNoColor(vfm.parse(input)).replace(R, '').replace(D, ''),
    ).toBe(expectedMdast.trim().replace(D, ''));
    expect(String(vfm.processSync(input))).toBe(expectedHtml);
  };
