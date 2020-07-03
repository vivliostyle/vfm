import { Plugin } from 'unified';
import { roleMappingTable } from '../utils/wai-aria';

const FENCE = ':';
const ROLE_SYMBOL = '@';
const FALLBACK_TAG = 'div';

let DEPTH = 0;

// remark
function locator(value: string, fromIndex: number) {
  return value.indexOf(FENCE.repeat(3), fromIndex);
}

const tokenizer: Tokenizer = function (eat, value, silent) {
  const now = eat.now();

  const fenceSymbol = FENCE.repeat(DEPTH + 3);
  const match = new RegExp(
    `^${fenceSymbol}\\s*([^\\s]*?)\\s*\\n([\\w\\W]+?)\\n${fenceSymbol}$`,
    'm',
  ).exec(value);
  if (!match) return;
  if (match.index !== 0) return;

  const [eaten, blockType, contentString] = match;

  if (silent) return true;

  const isRole = blockType.startsWith(ROLE_SYMBOL);
  const role = isRole ? 'doc-' + blockType.substring(1) : undefined;
  const type = (role && roleMappingTable[role]?.[0]) || FALLBACK_TAG;
  const className = !isRole && blockType ? [blockType] : undefined;

  const add = eat(eaten);

  DEPTH += 1;
  const exit = this.enterBlock();
  const children = this.tokenizeBlock(contentString, now);
  exit();
  DEPTH -= 1;

  return add({
    type,
    children,
    data: {
      hName: type,
      hProperties: {
        className,
        role,
      },
    },
  });
};

tokenizer.notInLink = true;
tokenizer.locator = locator;

export const mdast: Plugin = function () {
  if (!this.Parser) return;

  const { blockTokenizers, blockMethods } = this.Parser.prototype;
  blockTokenizers.fencedBlock = tokenizer;
  blockMethods.splice(blockMethods.indexOf('text'), 0, 'fencedBlock');
};
