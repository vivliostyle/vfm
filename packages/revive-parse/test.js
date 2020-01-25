import unified from "unified";
import revive from ".";
import revive2rehype from "revive-rehype";
import html from "rehype-stringify";
import inspect from "unist-util-inspect";

const processor = unified()
  .use(revive)
  .use(revive2rehype)
  .use(html);

const input = `
# はじめての Vibrant.js＜ヴァイブラント＞

**太字**や_斜体_も自由自在
`;

const parsed = processor.parse(input);
console.log(inspect(parsed));
const transformed = processor.runSync(parsed);
console.log(inspect(transformed));

processor.process(input).then(({ contents }) => {
  console.log(contents);
});
