import unistInspect from 'unist-util-inspect';
import { StringifyMarkdownOptions, VFM } from '../src';

/**
 * Utility for testing MDAST and HTML strings generated from Markdown.
 * @param input Markdown string.
 * @param expectedMdast Expected MDAST string.
 * @param expectedHtml Expected HTML string.
 * @param options Option for convert Markdown to VFM (HTML).
 */
export const buildProcessorTestingCode = (
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
) => (): any => {
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
  expect(unistInspect.noColor(vfm.parse(input))).toBe(expectedMdast.trim());
  expect(String(vfm.processSync(input))).toBe(expectedHtml);
};
