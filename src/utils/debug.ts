import initDebug from 'debug';
import { Node } from 'unist';
import { default as unistInspect } from 'unist-util-inspect';

export const debug = initDebug('vfm');

export const inspect = (header?: string) => () => (tree: Node) => {
  if (debug.enabled) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    if (header) debug(`\n### ${header} ###`);
    debug(unistInspect(tree));
  }
};
