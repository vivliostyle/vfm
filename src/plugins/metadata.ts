import {safeLoad as yaml} from 'js-yaml';
import {FrontmatterContent} from 'mdast';
import toString from 'mdast-util-to-string';
import {Node} from 'unist';
import {select} from 'unist-util-select';
import visit from 'unist-util-visit';
import {VFile} from 'vfile';

interface File extends VFile {
  data: {title: string};
}

// https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-meta/src/index.js

export function attacher() {
  return (tree: Node, file: File) => {
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
  };
}
