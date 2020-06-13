import {Processor} from 'unified';
import {Parent, Point, Node} from 'unist';
import u from 'unist-builder';
import {Eat, Locator} from 'remark-parse';
import {H} from 'mdast-util-to-hast';
import all from 'mdast-util-to-hast/lib/all';

type TokenizerInstance = {
  tokenizeBlock: (value: string) => Node | void;
  tokenizeInline: (value: string, location: Point) => Node | void;
};

interface RubyTokenizer {
  (
    this: TokenizerInstance,
    eat: Eat & {now: () => Point},
    value: string,
    silent?: boolean,
  ): boolean | Node | void;
  locator?: Locator;
  onlyAtStart?: boolean;
  notInBlock?: boolean;
  notInList?: boolean;
  notInLink?: boolean;
}

interface RubyParser {
  (this: Processor): void;
}

interface RubyNode extends Parent {
  rubyText: string;
}

interface RubyHandler {
  (h: H, node: RubyNode): any;
}

// remark
function locateRuby(value: string, fromIndex: number) {
  return value.indexOf('{', fromIndex);
}

const tokenizeRuby: RubyTokenizer = function (eat, value, silent) {
  const match = /^{(.+?)\|(.+?)}/.exec(value);

  if (match) {
    if (silent) {
      return true;
    }

    const now = eat.now();
    now.column += 1;
    now.offset! += 1;

    return eat(match[0])({
      type: 'ruby',
      rubyText: match[2],
      children: this.tokenizeInline(match[1], now),
      data: {hName: 'ruby'},
    });
  }
};

tokenizeRuby.notInLink = true;
tokenizeRuby.locator = locateRuby;

export const rubyParser: RubyParser = function () {
  if (!this.Parser) {
    return;
  }
  const {inlineTokenizers, inlineMethods} = this.Parser.prototype;
  inlineTokenizers.ruby = tokenizeRuby;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};

// rehype
export const rubyHandler: RubyHandler = (h, node) => {
  const rtStart =
    node.children.length > 0
      ? node.children[node.children.length - 1].position!.end
      : node.position!.start;

  const rtNode = h(
    {
      type: 'element',
      start: rtStart,
      end: node.position!.end,
    },
    'rt',
    [u('text', node.rubyText)],
  );

  return h(node, 'ruby', [...all(h, node), rtNode]);
};
