import initDebug from 'debug';
import type { Plugin, Pluggable } from 'unified';
import type { Node } from 'unist';
import { inspect as unistInspect } from 'unist-util-inspect';

export const debug = initDebug('vfm');

/** Plugin whose parameters and tree types are not constrained. */
export type AnyPlugin = Plugin<any[], any, any>;

/**
 * Debug plugin: dump the tree with `unist-util-inspect` when the `vfm` debug
 * namespace is enabled.
 * @param header - Label printed before the dump.
 * @returns Plugin.
 */
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

/**
 * Pre-bind leading arguments of `fn` while forwarding `this` from the call
 * site. Intended for unified plugin attachers that read `this.data()` etc.,
 * which `Function.prototype.bind` would clobber.
 */
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
 * Attach a brand to a value so it satisfies a branded `Pluggable` subtype.
 * Centralizes the only unsafe cast required to bridge plain unified-agnostic
 * plugin functions and the branded slot types used by `editPlugins`.
 */
export const brand = <B>(p: unknown): Pluggable & B => p as Pluggable & B;

/**
 * Merge multiple unified plugins into a single plugin whose transformer runs
 * each of the underlying transformers in order. Zero plugins yields a no-op.
 */
export const mergePlugins = (...plugins: AnyPlugin[]): AnyPlugin =>
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
