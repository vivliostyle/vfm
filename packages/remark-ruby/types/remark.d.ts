declare module 'remark-breaks';

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
