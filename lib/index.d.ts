import {Processor} from 'unified';
export interface StringifyMarkdownOptions {
  stylesheet?: string;
  partial?: boolean;
}
export declare function VFM({
  stylesheet,
  partial,
}?: StringifyMarkdownOptions): Processor;
export declare function stringify(
  markdownString: string,
  options?: StringifyMarkdownOptions,
): string;
