import {Node} from 'unist';
import visit from 'unist-util-visit';
import {VFile} from 'vfile';

interface CFile extends VFile {
  data: {title: string};
}

interface Position {
  line: number;
  column: number;
  offset: number;
}

interface CNode extends Node {
  value: string;
  lang: string;
  meta?: string;
  data?: {hProperties?: {[index: string]: string}};
  position: {
    start: Position;
    end: Position;
    indent: number[];
  };
}

// https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-meta/src/index.js

export function attacher() {
  return (tree: Node, file: CFile) => {
    visit<CNode>(tree, ['code'], (node, index, parent) => {
      const match = /^(.+?):(.+)$/.exec(node.lang);

      if (match) {
        const [, lang, title] = match;
        node.data = {...(node.data ?? {}), hProperties: {title}};
        node.lang = lang;
        node.position.end.offset -= title.length + 1;
      }

      if (node.meta) {
        const metadata = Object.fromEntries(
          node.meta
            .match(/(?:([^"\s]+?)=([^"\s]+)|([^"\s]+)="([^"]*?)")/g)
            ?.map((str) => {
              const [k, v] = str.split('=');
              return [k, v.replace(/(^"|"$)/g, '')];
            }) ?? [],
        );

        if (metadata.title) {
          node.data = {
            ...(node.data ?? {}),
            hProperties: {title: metadata.title},
          };
        }
      }
    });
  };
}
