'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.attacher = void 0;
var unist_util_visit_1 = __importDefault(require('unist-util-visit'));
var unist_util_select_1 = require('unist-util-select');
var mdast_util_to_string_1 = __importDefault(require('mdast-util-to-string'));
var js_yaml_1 = require('js-yaml');
// https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-meta/src/index.js
function attacher() {
  return function (tree, file) {
    var heading = unist_util_select_1.select('heading', tree);
    if (heading) {
      file.data.title = mdast_util_to_string_1.default(heading);
    }
    unist_util_visit_1.default(tree, ['yaml'], function (node) {
      file.data = __assign(
        __assign({}, file.data),
        js_yaml_1.safeLoad(node.value),
      );
    });
  };
}
exports.attacher = attacher;
