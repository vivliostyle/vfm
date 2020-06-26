'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
var remark_parse_1 = __importDefault(require('remark-parse'));
var remark_math_1 = __importDefault(require('remark-math'));
var remark_breaks_1 = __importDefault(require('remark-breaks'));
var remark_frontmatter_1 = __importDefault(require('remark-frontmatter'));
var ruby_1 = require('./plugins/ruby');
var fenced_block_1 = require('./plugins/fenced-block');
var metadata_1 = require('./plugins/metadata');
exports.default = [
  [remark_parse_1.default, {commonmark: true}],
  fenced_block_1.attacher,
  remark_breaks_1.default,
  ruby_1.attacher,
  remark_math_1.default,
  remark_frontmatter_1.default,
  metadata_1.attacher,
];
