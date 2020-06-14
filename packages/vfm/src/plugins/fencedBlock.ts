import {Plugin} from 'unified';
import {Parent} from 'unist';
import u from 'unist-builder';
import {H, Handler} from 'mdast-util-to-hast';
import all from 'mdast-util-to-hast/lib/all';

// remark
function locator(value: string, fromIndex: number) {
  return value.indexOf(':::', fromIndex);
}

const tokenizer: Tokenizer = function (eat, value, silent) {
  const now = eat.now();
  const match = /^:::(.*?)\n([\w\W]+?)\n:::$/m.exec(value);
  if (!match) return;
  if (match.index !== 0) return;

  const [eaten, blockType, contentString] = match;

  if (silent) return true;

  const add = eat(eaten);

  const exit = this.enterBlock();
  const contents = this.tokenizeBlock(contentString, now);
  exit();

  return add({
    type: 'div',
    children: contents,
    data: {
      hName: 'div',
      hProperties: {
        className: blockType ? [blockType] : undefined,
      },
    },
  });
};

tokenizer.notInLink = true;
tokenizer.locator = locator;

export const parser: Plugin = function () {
  if (!this.Parser) return;

  const {blockTokenizers, blockMethods} = this.Parser.prototype;
  blockTokenizers.fencedBlock = tokenizer;
  blockMethods.splice(blockMethods.indexOf('text'), 0, 'fencedBlock');
};
