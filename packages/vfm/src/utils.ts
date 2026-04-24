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

/**
 * Recursively remove function members from a type. Distributes over unions
 * and recurses into arrays and object types. Useful for deriving
 * YAML-serializable variants of types that otherwise admit factory callbacks.
 */
export type StripFunctions<T> = T extends (...args: any[]) => any
  ? never
  : T extends readonly (infer U)[]
    ? StripFunctions<U>[]
    : T extends object
      ? { [K in keyof T]: StripFunctions<T[K]> }
      : T;
