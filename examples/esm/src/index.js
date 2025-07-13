import { stringify } from '@vivliostyle/vfm';

const md = `
# Hello, VFM!

This is a simple example of using VFM to render Markdown to HTML.
`;

const main = () => {
  const html = stringify(md);
  console.log(html);
};

main();
