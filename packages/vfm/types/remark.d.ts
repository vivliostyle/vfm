declare module 'hast-util-find-and-replace';
declare module 'remark-shortcodes';
declare module 'rehype-format';
declare module 'remark-breaks';
declare module 'remark-attr';
declare module 'md-attr-parser' {
  export default function (
    value: string,
    indexNext?: number,
  ): {
    prop: {
      id?: string;
      class?: string[];
      [key: string]: unknown;
    };
    eaten: string;
  };
}

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

/** Key/Value pair. */
type KeyValue = { [key: string]: any };
