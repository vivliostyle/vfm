import unistInspect from 'unist-util-inspect';
import { VFM } from '../src';

export const buildProcessorTestingCode = (
  input: string,
  expectedMdast: string,
  expectedHtml: string,
) => (): any => {
  const vfm = VFM({ partial: true }).freeze();
  expect(unistInspect.noColor(vfm.parse(input))).toBe(expectedMdast.trim());
  expect(String(vfm.processSync(input))).toBe(expectedHtml);
};
