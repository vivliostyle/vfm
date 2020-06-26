'use strict';
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.handler = exports.attacher = void 0;
var unist_builder_1 = __importDefault(require('unist-builder'));
var all_1 = __importDefault(require('mdast-util-to-hast/lib/all'));
// remark
function locateRuby(value, fromIndex) {
  return value.indexOf('{', fromIndex);
}
var tokenizer = function (eat, value, silent) {
  var now = eat.now();
  var match = /^{(.+?)\|(.+?)}/.exec(value);
  if (!match) return;
  var eaten = match[0],
    inlineContent = match[1],
    rubyText = match[2];
  if (silent) return true;
  now.column += 1;
  now.offset += 1;
  return eat(eaten)({
    type: 'ruby',
    children: this.tokenizeInline(inlineContent, now),
    data: {hName: 'ruby', rubyText: rubyText},
  });
};
tokenizer.notInLink = true;
tokenizer.locator = locateRuby;
exports.attacher = function () {
  if (!this.Parser) return;
  var _a = this.Parser.prototype,
    inlineTokenizers = _a.inlineTokenizers,
    inlineMethods = _a.inlineMethods;
  inlineTokenizers.ruby = tokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
};
// rehype
exports.handler = function (h, node) {
  var rtStart =
    node.children.length > 0
      ? node.children[node.children.length - 1].position.end
      : node.position.start;
  var rtNode = h(
    {
      type: 'element',
      start: rtStart,
      end: node.position.end,
    },
    'rt',
    [unist_builder_1.default('text', node.data.rubyText)],
  );
  return h(node, 'ruby', __spreadArrays(all_1.default(h, node), [rtNode]));
};
