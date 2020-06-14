import {Plugin} from 'unified';
import {Parent} from 'unist';
import u from 'unist-builder';
import {H, Handler} from 'mdast-util-to-hast';
import all from 'mdast-util-to-hast/lib/all';

const FENCE = ':';

let DEPTH = 0;

// remark
function locator(value: string, fromIndex: number) {
  return value.indexOf(':::', fromIndex);
}

const tokenizer: Tokenizer = function (eat, value, silent) {
  const now = eat.now();

  const fenceSymbol = FENCE.repeat(DEPTH + 3);
  const match = new RegExp(
    `^${fenceSymbol}(.*?)\\n([\\w\\W]+?)\\n${fenceSymbol}$`,
    'm',
  ).exec(value);
  if (!match) return;
  if (match.index !== 0) return;

  const [eaten, blockType, contentString] = match;

  if (silent) return true;

  const add = eat(eaten);

  DEPTH += 1;
  const exit = this.enterBlock();
  const children = this.tokenizeBlock(contentString, now);
  exit();
  DEPTH -= 1;

  const type = 'div';

  return add({
    type,
    children,
    data: {
      hName: type,
      hProperties: {
        className: blockType ? [blockType] : undefined,
      },
    },
  });
};

tokenizer.notInLink = true;
tokenizer.locator = locator;

export const attacher: Plugin = function () {
  if (!this.Parser) return;

  const {blockTokenizers, blockMethods} = this.Parser.prototype;
  blockTokenizers.fencedBlock = tokenizer;
  blockMethods.splice(blockMethods.indexOf('text'), 0, 'fencedBlock');
};
