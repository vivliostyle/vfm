import initDebug from 'debug';
import type { Node } from 'unist';
import { inspect as unistInspect } from 'unist-util-inspect';

export const debug = initDebug('vfm');

export const inspect = (header?: string) => () => (tree: Node) => {
  if (debug.enabled) {
    if (header) debug(`\n### ${header} ###`);
    debug(unistInspect(tree));
  }
};
