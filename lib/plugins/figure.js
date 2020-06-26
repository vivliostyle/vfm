'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.handler = void 0;
var hastscript_1 = __importDefault(require('hastscript'));
var hast_util_is_element_1 = __importDefault(require('hast-util-is-element'));
var unist_util_visit_1 = __importDefault(require('unist-util-visit'));
function handler(options) {
  if (options === void 0) {
    options = {};
  }
  function transformer(tree) {
    return unist_util_visit_1.default(tree, 'element', function (
      node,
      index,
      parent,
    ) {
      if (!hast_util_is_element_1.default(node, 'img')) return;
      var alt = node.properties.alt;
      if (!alt) return;
      parent.children[index] = hastscript_1.default(
        'figure',
        node,
        hastscript_1.default('figcaption', alt),
      );
    });
  }
  return transformer;
}
exports.handler = handler;
