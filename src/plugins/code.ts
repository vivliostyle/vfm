import {Code} from 'mdast';
import {Node} from 'unist';
import visit from 'unist-util-visit';

export function attacher() {
  return (tree: Node) => {
    visit<Code>(tree, ['code'], (node) => {
      const match = /^(.+?):(.+)$/.exec(node.lang ?? '');

      if (match) {
        const [, lang, title] = match;
        node.data = {...(node.data ?? {}), hProperties: {title}};
        node.lang = lang;
        if (node.position?.end.offset) {
          node.position!.end.offset -= title.length + 1;
        }
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
