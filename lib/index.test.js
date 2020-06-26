'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', {enumerable: true, value: v});
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', {value: true});
var lib = __importStar(require('./index'));
function partial(body) {
  return lib.stringify(body, {partial: true});
}
it.skip('handle custom attributes', function () {
  // MEMO:
  // https://github.com/sethvincent/remark-bracketed-spans
  // https://github.com/Paperist/remark-crossref/
  // https://github.com/mrzmmr/remark-behead
  expect(partial('\n# Introduction {#introduction}\n')).toBe(
    '<h1 id="introduction">Introduction</h1>',
  );
  expect(
    partial(
      '\n[text in the span]{.class .other-class key=val another=example}\n',
    ),
  ).toBe('<h1 id="introduction">Introduction</h1>');
});
it('handle role', function () {
  expect(partial('\n:::@tip\n# Tips\n:::\n')).toBe(
    '<aside role="doc-tip"><h1 id="tips">Tips</h1></aside>',
  );
  expect(partial('\n:::@appendix\n# Appendix\n:::\n')).toBe(
    '<section role="doc-appendix"><h1 id="appendix">Appendix</h1></section>',
  );
});
it('reject incorrect fences', function () {
  expect(partial('\n::::appendix\n:::::nested\n# Title\n:::::\n::::\n')).toBe(
    '<p>::::appendix<br>\n:::::nested</p>\n<h1 id="title">Title</h1>\n<p>:::::<br>\n::::</p>',
  );
  expect(partial('\n:::appendix\n:::::nested\n# Title\n:::::\n:::\n')).toBe(
    '<div class="appendix"><p>:::::nested</p><h1 id="title">Title</h1><p>:::::</p></div>',
  );
});
it('handle fenced block', function () {
  expect(partial('\n:::appendix\n# Appendix\ntest\n:::\n')).toBe(
    '<div class="appendix"><h1 id="appendix">Appendix</h1><p>test</p></div>',
  );
  expect(
    partial(
      '\n:::\n# Plain block\n:::\n\n---\n\n:::another\nAnother block\n:::\n',
    ),
  ).toBe(
    '<div><h1 id="plain-block">Plain block</h1></div>\n<hr>\n<div class="another"><p>Another block</p></div>',
  );
  expect(partial('\n:::appendix\nA\n\n::::nested\n# Title\n::::\n:::\n')).toBe(
    '<div class="appendix"><p>A</p><div class="nested"><h1 id="title">Title</h1></div></div>',
  );
});
it('handle hard line break', function () {
  expect(partial('\na\nb')).toBe('<p>a<br>\nb</p>');
});
it('stringify math', function () {
  expect(partial('$$sum$$')).toContain(
    '<p><span class="math math-inline"><mjx-container class="MathJax" jax="SVG">',
  );
});
it('stringify ruby', function () {
  expect(partial('{A|B}')).toBe('<p><ruby>A<rt>B</rt></ruby></p>');
});
it('convert img to figure', function () {
  expect(partial('![fig](image.png)')).toBe(
    '<p><figure><img src="image.png" alt="fig"><figcaption>fig</figcaption></figure></p>',
  );
});
it('stringify markdown string into html document', function () {
  expect(lib.stringify('# こんにちは')).toBe(
    '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n<h1 id="\u3053\u3093\u306B\u3061\u306F">\u3053\u3093\u306B\u3061\u306F</h1>\n</body>\n</html>\n',
  );
});
