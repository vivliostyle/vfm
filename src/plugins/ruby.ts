import { Handler } from 'mdast-util-to-hast';
import all from 'mdast-util-to-hast/lib/all';
import { Plugin } from 'unified';
import u from 'unist-builder';

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
  now.offset += 1;

  return eat(eaten)({
    type: 'ruby',
    children: this.tokenizeInline(inlineContent, now),
    data: { hName: 'ruby', rubyText },
  });
};

tokenizer.notInLink = true;
tokenizer.locator = locateRuby;

export const mdast: Plugin = function () {
  if (!this.Parser) return;

  const { inlineTokenizers, inlineMethods } = this.Parser.prototype;
  inlineTokenizers.ruby = tokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};

// rehype
export const handler: Handler = (h, node) => {
  if (!node.data) node.data = {};
  const rtNode = h(
    {
      type: 'element',
    },
    'rt',
    [u('text', node.data.rubyText as string)],
  );

  return h(node, 'ruby', [...all(h, node), rtNode]);
};
