import initDebug from 'debug';
import type unified from 'unified';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { inspect as unistInspect } from 'unist-util-inspect';

export const debug = initDebug('vfm');

export const inspect =
  (header?: string): Plugin<[]> =>
  () =>
  (tree: Node) => {
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

export function partial<
  TThis,
  TPreset extends unknown[],
  TLater extends unknown[],
  TReturn,
>(
  fn: (this: TThis, ...args: [...TPreset, ...TLater]) => TReturn,
  ...presetArgs: TPreset
): (this: TThis, ...args: TLater) => TReturn {
  return function (this: TThis, ...laterArgs: TLater): TReturn {
    return fn.call(this, ...presetArgs, ...laterArgs);
  };
}

/**
 * Merge multiple unified plugins into a single plugin whose transformer runs
 * each of the underlying transformers in order. Zero plugins yields a no-op.
 */
export const mergePlugins = (...plugins: unified.Plugin[]): unified.Plugin =>
  function mergedAttacher(this: unknown, ...opts: unknown[]) {
    const transformers = plugins
      .map((plugin) =>
        (plugin as (this: unknown, ...args: unknown[]) => unknown).apply(
          this,
          opts,
        ),
      )
      .filter(
        (t): t is (tree: unknown, file: unknown) => void =>
          typeof t === 'function',
      );
    return (tree: unknown, file: unknown) => {
      for (const t of transformers) t(tree, file);
    };
  };
