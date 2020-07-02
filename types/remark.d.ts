declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string;
  }
}

declare module 'remark-math';
declare module 'remark-breaks';
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
declare module 'rehype-mathjax';
declare module 'unist-util-remove';
declare module 'rehype-katex';
declare module 'rehype-slug';
declare module 'hastscript';
declare module 'mdast-util-to-hast/lib/all';
declare module 'mdast-util-to-string';
declare module 'hast-util-find-and-replace';
declare module 'hast-util-is-element';

declare module 'to-vfile';

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
