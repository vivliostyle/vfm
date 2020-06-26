'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.stringify = exports.VFM = void 0;
var unified_1 = __importDefault(require('unified'));
var rehype_document_1 = __importDefault(require('rehype-document'));
var rehype_stringify_1 = __importDefault(require('rehype-stringify'));
var revive_parse_1 = __importDefault(require('./revive-parse'));
var revive_rehype_1 = __importDefault(require('./revive-rehype'));
var debug_1 = require('./utils/debug');
function VFM(_a) {
  var _b = _a === void 0 ? {} : _a,
    _c = _b.stylesheet,
    stylesheet = _c === void 0 ? undefined : _c,
    _d = _b.partial,
    partial = _d === void 0 ? false : _d;
  var processor = unified_1
    .default()
    .use(revive_parse_1.default)
    .use(revive_rehype_1.default);
  if (!partial) {
    processor.use(rehype_document_1.default, {language: 'ja', css: stylesheet});
  }
  processor.use(rehype_stringify_1.default);
  return processor;
}
exports.VFM = VFM;
function stringify(markdownString, options) {
  if (options === void 0) {
    options = {};
  }
  var processor = VFM(options);
  if (debug_1.debug.enabled) {
    var inspect = require('unist-util-inspect');
    debug_1.debug(inspect(processor.parse(markdownString)));
  }
  return String(processor.processSync(markdownString));
}
exports.stringify = stringify;
