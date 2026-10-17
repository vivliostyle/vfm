declare module 'remark-shortcodes';
declare module 'remark-footnotes';
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

// ---------------------------------------------------------------------------
// remark-parse 8 tokenizer API.
//
// remark-parse 11 exposes `this.parser` (a `mdast-util-from-markdown`
// wrapper) instead of `this.Parser`, so code written against these types is
// never reached there. Kept until the math tokenizer is rewritten as a
// micromark extension.
// @todo Remove together with the tokenizer in `plugins/math.ts` (#287).
// ---------------------------------------------------------------------------

type Point = { line: number; column: number; offset: number };

type Eat = (subvalue: string) => <N extends import('unist').Node>(node: N) => N;

type Locator = (value: string, fromIndex: number) => number;

interface Tokenizer {
  (
    this: TokenizerInstance,
    eat: Eat & { now: () => Point },
    value: string,
    silent?: boolean,
  ): boolean | import('unist').Node | void;
  locator?: Locator;
  onlyAtStart?: boolean;
  notInBlock?: boolean;
  notInList?: boolean;
  notInLink?: boolean;
}

type TokenizerInstance = {
  tokenizeBlock: (
    value: string,
    location: Point,
  ) => import('unist').Node | void;
  tokenizeInline: (
    value: string,
    location: Point,
  ) => import('unist').Node | void;
  enterBlock: () => () => void;
};

/** Shape of `this.Parser` under remark-parse 8. */
type LegacyParser = {
  prototype: {
    inlineTokenizers: Record<string, Tokenizer>;
    inlineMethods: string[];
  };
};

/** Key/Value pair. */
type KeyValue = { [key: string]: any };
