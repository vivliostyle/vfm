'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
var remark_rehype_1 = __importDefault(require('remark-rehype'));
var rehype_raw_1 = __importDefault(require('rehype-raw'));
var rehype_mathjax_1 = __importDefault(require('rehype-mathjax'));
var rehype_slug_1 = __importDefault(require('rehype-slug'));
var ruby_1 = require('./plugins/ruby');
var figure_1 = require('./plugins/figure');
exports.default = [
  [
    remark_rehype_1.default,
    {allowDangerousHtml: true, handlers: {ruby: ruby_1.handler}},
  ],
  rehype_raw_1.default,
  rehype_mathjax_1.default,
  figure_1.handler,
  rehype_slug_1.default,
];
