import { expect } from 'vitest';
import { inspectNoColor as unistInspectNoColor } from 'unist-util-inspect';
import { StringifyMarkdownOptions, VFM } from '../src';

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
      style = undefined,
      partial = true,
      title = undefined,
      language = undefined,
      replace = undefined,
      hardLineBreaks = false,
      disableFormatHtml = true,
      math = false,
    }: StringifyMarkdownOptions = {},
  ) =>
  (): any => {
    const vfm = VFM({
      style,
      partial,
      title,
      language,
      replace,
      hardLineBreaks,
      disableFormatHtml,
      math,
    }).freeze();
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
