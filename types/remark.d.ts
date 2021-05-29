declare module 'rehype-raw' {
  import { Plugin } from 'unified';
  const plugin: Plugin;
  export default plugin;
}

declare module 'hast-util-find-and-replace';
declare module 'remark-shortcodes';
declare module 'hast-util-is-element';
declare module 'hast-util-select';
declare module 'hastscript';
declare module 'mdast-util-to-hast/lib/all';
declare module 'mdast-util-to-string';
declare module 'mdast-util-find-and-replace';
declare module 'rehype-katex';
declare module 'remark-slug';
declare module 'rehype-slug';
declare module 'rehype-format';
declare module 'remark-breaks';
declare module 'remark-footnotes';
declare module 'remark-math';
// declare module 'to-vfile';
declare module 'unist-util-remove';
declare module 'remark-attr';
declare module 'unist-util-find-after';
declare module 'doctype';

interface Tokenizer {
  (
    this: TokenizerInstance,
    eat: Eat & { now: () => Point },
    value: string,
    silent?: boolean,
  ): boolean | Node | void;
  locator?: Locator;
  onlyAtStart?: boolean;
  notInBlock?: boolean;
  notInList?: boolean;
  notInLink?: boolean;
}

type TokenizerInstance = {
  tokenizeBlock: (value: string, location: Point) => Node | void;
  tokenizeInline: (value: string, location: Point) => Node | void;
  enterBlock: () => () => void;
};
