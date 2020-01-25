import all from "mdast-util-to-hast/lib/all";
import u from "unist-builder";

// Derived from @spring-raining
// https://github.com/vivliostyle/vivliostyle_doc/blob/gh-pages/ja/vivliostyle-user-group-vol2/spring-raining/index.md

export function parser() {
  const { Parser } = this;
  if (!Parser) return;

  const { inlineTokenizers, inlineMethods } = Parser.prototype;
  tokenizer.locator = locator;
  inlineTokenizers.ruby = tokenizer;
  inlineMethods.splice(inlineMethods.indexOf("text"), 0, "ruby");
}

function locator(value, fromIndex) {
  return value.indexOf("[", fromIndex);
}

function tokenizer(eat, value, silent) {
  if (value.charAt(0) !== "[") {
    return;
  }
  const rtStartIndex = value.indexOf("{");
  const rtEndIndex = value.indexOf("}", rtStartIndex);
  if (rtStartIndex <= 0 || rtEndIndex <= 0) {
    return;
  }
  const rubyRef = value.slice(1, rtStartIndex);
  const rubyText = value.slice(rtStartIndex + 1, rtEndIndex);
  if (silent) {
    return true;
  }
  const now = eat.now();
  now.column += 1;
  now.offset += 1;
  return eat(value.slice(0, rtEndIndex + 1))({
    type: "ruby",
    rubyText,
    children: this.tokenizeInline(rubyRef, now),
    data: { hName: "ruby" }
  });
}

export function handler(h, node) {
  const rtStart =
    node.children.length > 0
      ? node.children[node.children.length - 1].position.end
      : node.position.start;
  const rtNode = h(
    {
      start: rtStart,
      end: node.position.end
    },
    "rt",
    [u("text", node.rubyText)]
  );
  return h(node, "ruby", [...all(h, node), rtNode]);
}
