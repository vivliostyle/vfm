import { Code } from 'mdast';
import { Handler } from 'mdast-util-to-hast';
import refractor from 'refractor';
import { Node } from 'unist';
import { u } from 'unist-builder';
import visit from 'unist-util-visit';

export function mdast() {
  return (tree: Node) => {
    visit<Code>(tree, 'code', (node) => {
      const match = /^(.+?):(.+)$/.exec(node.lang ?? '');

      // parse lang:title syntax
      if (match) {
        const [, lang, title] = match;
        node.data = { ...(node.data ?? {}), hProperties: { title } };
        node.lang = lang;
        if (node.position?.end.offset) {
          node.position.end.offset -= title.length + 1;
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

        // copy title metadata for figure handler injecting figcaption
        if (metadata.title) {
          node.data = {
            ...(node.data ?? {}),
            hProperties: { title: metadata.title },
          };
        }
      }

      // syntax highlight
      if (node.lang && refractor.registered(node.lang)) {
        if (!node.data) node.data = {};
        node.data.hChildren = refractor.highlight(node.value, node.lang);
      }
    });
  };
}

export function handler(h: any, node: any): Handler {
  const value = node.value || '';
  const lang = node.lang ? node.lang.match(/^[^ \t]+(?=[ \t]|$)/) : 'text';
  const props = { className: ['language-' + lang] };
  return h(node.position, 'pre', props, [
    h(node, 'code', props, [u('text', value)]),
  ]);
}
