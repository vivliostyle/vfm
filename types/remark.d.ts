declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string;
  }
}

declare module 'rehype-raw' {
  import { Plugin } from 'unified';
  const plugin: Plugin;
  export default plugin;
}

declare module 'rehype-stringify' {
  import { Plugin } from 'unified';
  const plugin: Plugin;
  export default plugin;
}

declare module 'hast-util-find-and-replace';
declare module 'remark-shortcodes';
declare module 'hast-util-is-element';
declare module 'hastscript';
declare module 'mdast-util-to-hast/lib/all';
declare module 'mdast-util-to-string';
declare module 'rehype-katex';
declare module 'rehype-mathjax';
declare module 'rehype-slug';
declare module 'remark-breaks';
declare module 'remark-footnotes';
declare module 'remark-math';
declare module 'to-vfile';
declare module 'unist-util-remove';

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
