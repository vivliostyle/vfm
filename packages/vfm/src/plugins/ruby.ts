import {Plugin} from 'unified';
import {Parent} from 'unist';
import u from 'unist-builder';
import {H, Handler} from 'mdast-util-to-hast';
import all from 'mdast-util-to-hast/lib/all';

// remark
function locateRuby(value: string, fromIndex: number) {
  return value.indexOf('{', fromIndex);
}

const tokenizeRuby: Tokenizer = function (eat, value, silent) {
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
      children: this.tokenizeInline(match[1], now),
      data: {hName: 'ruby', rubyText: match[2]},
    });
  }
};

tokenizeRuby.notInLink = true;
tokenizeRuby.locator = locateRuby;

export const rubyParser: Plugin = function () {
  if (!this.Parser) {
    return;
  }
  const {inlineTokenizers, inlineMethods} = this.Parser.prototype;
  inlineTokenizers.ruby = tokenizeRuby;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};

// rehype
export const rubyHandler: Handler = (h, node) => {
  const rtStart =
    (node as Parent).children.length > 0
      ? (node as Parent).children[(node as Parent).children.length - 1]
          .position!.end
      : node.position!.start;

  const rtNode = h(
    {
      type: 'element',
      start: rtStart,
      end: node.position!.end,
    },
    'rt',
    [u('text', node.data!.rubyText as string)],
  );

  return h(node, 'ruby', [...all(h, node), rtNode]);
};
