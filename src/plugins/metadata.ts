import { safeLoad as yaml } from 'js-yaml';
import { FrontmatterContent, Literal } from 'mdast';
import toString from 'mdast-util-to-string';
import { Node } from 'unist';
import { select } from 'unist-util-select';
import visit from 'unist-util-visit';
import { VFile } from 'vfile';

interface File extends VFile {
  data: { title: string; toc: boolean };
}

// https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-meta/src/index.js

export const mdast = () => (tree: Node, file: File) => {
  const heading = select('heading', tree);
  if (heading) {
    file.data.title = toString(heading);
  }

  visit<FrontmatterContent>(tree, ['yaml'], (node) => {
    file.data = {
      ...file.data,
      ...yaml(node.value),
    };
  });

  file.data.toc = false;
  visit<Literal>(tree, ['shortcode'], (node) => {
    if (node.identifier !== 'toc') return;
    file.data.toc = true;
  });
};
