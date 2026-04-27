import findAndReplace from 'hast-util-find-and-replace';
import { h } from 'hastscript';
import type { Node } from 'unist';
import * as v from 'valibot';

type H = typeof h;

/**
 * Replace rule.
 *
 * Declared as `interface` so TS keeps `ReplaceRule` as a nominal name in
 * `.d.ts` output. Without it, `v.intersect` consumers inline the
 * structural form, which reaches `typeof h` from `hastscript` and trips
 * TS2883 because `hastscript/lib/core.js` is not in its `exports` map.
 * The schema below pins to this type via `v.GenericSchema<ReplaceRule>`,
 * so TS rejects drift at compile time.
 *
 * @todo Drop the interface + annotation pinning once `hastscript` exposes
 *   `core.js` (or `HChild`/`HProperties`) through its `package.json#exports`
 *   so consumers can resolve the canonical path TypeScript records for
 *   those names. As of `hastscript@9.0.1`, only the package root is
 *   exposed.
 */
export interface ReplaceRule {
  test: RegExp;
  match: (result: RegExpMatchArray, h: H) => Node | string;
}

export const ReplaceRuleSchema: v.GenericSchema<ReplaceRule> = v.object({
  test: v.instance(RegExp),
  match: v.pipe(
    v.function() as v.GenericSchema<ReplaceRule['match']>,
    v.metadata({
      typeString:
        '(result: RegExpMatchArray, h: typeof import("hastscript").h) => import("unist").Node | string',
    }),
  ),
});

export interface ReplaceOptions {
  replace?: ReplaceRule[] | undefined;
}

export const ReplaceOptionsSchema: v.GenericSchema<ReplaceOptions> = v.object({
  replace: v.optional(v.array(ReplaceRuleSchema)),
});

export function replace({ replace: rules = [] }: ReplaceOptions = {}) {
  if (rules.length === 0) return;
  const search = rules.map(
    (rule) =>
      [
        rule.test,
        (...result: RegExpMatchArray) => rule.match(result, h),
      ] as const,
  );
  return (tree: Node) => findAndReplace(tree, search);
}
