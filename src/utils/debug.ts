import initDebug from 'debug';
import {Node} from 'unist';

export const debug = initDebug('vfm');

export const inspect = (header?: string) => () => (tree: Node) => {
  if (debug.enabled) {
    const inspect = require('unist-util-inspect');
    if (header) debug(`\n### ${header} ###`);
    debug(inspect(tree));
  }
};
