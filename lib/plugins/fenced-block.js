'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.attacher = void 0;
var wai_aria_1 = require('../utils/wai-aria');
var FENCE = ':';
var ROLE_SYMBOL = '@';
var FALLBACK_TAG = 'div';
var DEPTH = 0;
// remark
function locator(value, fromIndex) {
  return value.indexOf(FENCE.repeat(3), fromIndex);
}
var tokenizer = function (eat, value, silent) {
  var _a;
  var now = eat.now();
  var fenceSymbol = FENCE.repeat(DEPTH + 3);
  var match = new RegExp(
    '^' + fenceSymbol + 's*(.*?)s*\\n([\\w\\W]+?)\\n' + fenceSymbol + '$',
    'm',
  ).exec(value);
  if (!match) return;
  if (match.index !== 0) return;
  var eaten = match[0],
    blockType = match[1],
    contentString = match[2];
  if (silent) return true;
  var isRole = blockType.startsWith(ROLE_SYMBOL);
  var role = isRole ? 'doc-' + blockType.substring(1) : undefined;
  var type =
    (role &&
      ((_a = wai_aria_1.roleMappingTable[role]) === null || _a === void 0
        ? void 0
        : _a[0])) ||
    FALLBACK_TAG;
  var className = !isRole && blockType ? [blockType] : undefined;
  var add = eat(eaten);
  DEPTH += 1;
  var exit = this.enterBlock();
  var children = this.tokenizeBlock(contentString, now);
  exit();
  DEPTH -= 1;
  return add({
    type: type,
    children: children,
    data: {
      hName: type,
      hProperties: {
        className: className,
        role: role,
      },
    },
  });
};
tokenizer.notInLink = true;
tokenizer.locator = locator;
exports.attacher = function () {
  if (!this.Parser) return;
  var _a = this.Parser.prototype,
    blockTokenizers = _a.blockTokenizers,
    blockMethods = _a.blockMethods;
  blockTokenizers.fencedBlock = tokenizer;
  blockMethods.splice(blockMethods.indexOf('text'), 0, 'fencedBlock');
};
