import { type Handler, all } from 'mdast-util-to-hast';
import type {
  Eat as RemarkEat,
  Parser as RemarkParser,
  Tokenizer as RemarkTokenizer,
} from 'remark-parse';
import type { Plugin } from 'unified';
import type { Data, Node, Parent, Point as UnistPoint } from 'unist';
import { u } from 'unist-builder';

/**
 * @todo Drop `hName` after upgrading to `mdast-util-to-hast@>=13`, which ships
 *   the same `Data` augmentation as a side effect import.
 */
declare module 'unist' {
  interface Data {
    hName?: string | undefined;
  }
}

type Ruby = Parent & {
  type: 'ruby';
  data: Data & { hName: 'ruby'; rubyText: string };
};

const isRuby = (node: unknown): node is Ruby =>
  !!node &&
  typeof node === 'object' &&
  (node as { type?: unknown }).type === 'ruby' &&
  typeof (node as { data?: { rubyText?: unknown } }).data?.rubyText ===
    'string';

// `unist` types `Point.offset` as optional, but `now()` always sets it:
// https://github.com/remarkjs/remark/blob/remark-parse@8.0.3/packages/remark-parse/lib/tokenizer.js#L133
type Point = Omit<UnistPoint, 'offset'> & {
  offset: NonNullable<UnistPoint['offset']>;
};

// `remark-parse`'s `Tokenizer` omits `this`; the runtime binds the parser:
// https://github.com/remarkjs/remark/blob/remark-parse@8.0.3/packages/remark-parse/lib/tokenizer.js#L62
type Tokenizer = Pick<RemarkTokenizer, keyof RemarkTokenizer> & {
  (
    this: RemarkParser & {
      // `tokenizeInline` is a parser prototype method absent from remark-parse's types:
      // https://github.com/remarkjs/remark/blob/remark-parse@8.0.3/packages/remark-parse/lib/parser.js#L134
      tokenizeInline(value: string, location: Point): Node[];
    },
    // `remark-parse`'s `Eat` type omits `now()`, which the runtime sets:
    // https://github.com/remarkjs/remark/blob/remark-parse@8.0.3/packages/remark-parse/lib/tokenizer.js#L31
    eat: RemarkEat & { now(): Point },
    value: string,
    silent?: boolean,
  ): boolean | Node | void;
};

const tokenizer: Tokenizer = function (eat, value, silent) {
  const now = eat.now();
  const match = /^{(.+?)(?<=[^\\|])\|(.+?)}/.exec(value);
  if (!match) return;

  // The regex has exactly 2 capture groups
  const eaten = match[0]!;
  const inlineContent = match[1]!;
  const rubyText = match[2]!;

  if (silent) return true;

  now.column += 1;
  now.offset += 1;

  const children = this.tokenizeInline(inlineContent, now);
  return eat(eaten)({
    type: 'ruby',
    children,
    data: { hName: 'ruby', rubyText },
  } satisfies Ruby);
};

tokenizer.notInLink = true;
tokenizer.locator = (value, fromIndex) => value.indexOf('{', fromIndex);

// remark
export const mdast: Plugin = function () {
  if (!this.Parser) return;

  const { inlineTokenizers, inlineMethods } = this.Parser
    .prototype as RemarkParser;
  inlineTokenizers.ruby = tokenizer as RemarkTokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};

// rehype
export const handler: Handler = (h, node) => {
  const ruby: unknown = node;
  if (!isRuby(ruby)) return undefined;
  const rtNode = h(
    {
      type: 'element',
    },
    'rt',
    [u('text', ruby.data.rubyText)],
  );

  return h(node, 'ruby', [...all(h, node), rtNode]);
};
