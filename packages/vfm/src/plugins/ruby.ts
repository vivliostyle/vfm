import {Plugin} from 'unified';
import {Parent} from 'unist';
import u from 'unist-builder';
import {Handler} from 'mdast-util-to-hast';
import all from 'mdast-util-to-hast/lib/all';

// remark
function locateRuby(value: string, fromIndex: number) {
  return value.indexOf('{', fromIndex);
}

const tokenizer: Tokenizer = function (eat, value, silent) {
  const now = eat.now();
  const match = /^{(.+?)\|(.+?)}/.exec(value);
  if (!match) return;

  const [eaten, inlineContent, rubyText] = match;

  if (silent) return true;

  now.column += 1;
  now.offset! += 1;

  return eat(eaten)({
    type: 'ruby',
    children: this.tokenizeInline(inlineContent, now),
    data: {hName: 'ruby', rubyText},
  });
};

tokenizer.notInLink = true;
tokenizer.locator = locateRuby;

export const attacher: Plugin = function () {
  if (!this.Parser) return;

  const {inlineTokenizers, inlineMethods} = this.Parser.prototype;
  inlineTokenizers.ruby = tokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};

// rehype
export const handler: Handler = (h, node) => {
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
