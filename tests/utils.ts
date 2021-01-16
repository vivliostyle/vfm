import unistInspect from 'unist-util-inspect';
import { StringifyMarkdownOptions, VFM } from '../src';

export const buildProcessorTestingCode = (
  input: string,
  expectedMdast: string,
  expectedHtml: string,
  options: StringifyMarkdownOptions = {
    style: undefined,
    partial: true,
    title: undefined,
    language: undefined,
    replace: undefined,
  },
) => (): any => {
  const vfm = VFM(options).freeze();
  expect(unistInspect.noColor(vfm.parse(input))).toBe(expectedMdast.trim());
  expect(String(vfm.processSync(input))).toBe(expectedHtml);
};
