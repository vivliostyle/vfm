import findAndReplace from 'hast-util-find-and-replace';
import { h } from 'hastscript';
import type { Node } from 'unist';
import * as v from 'valibot';

type H = typeof h;

/**
 * Replace rule.
 *
 * Declared as an `interface` (rather than a type alias derived from the
 * schema via `v.InferInput`) so that TypeScript records `ReplaceRule` as a
 * single nominal name in declaration output. When `ReplaceOptionsSchema` is
 * composed by a downstream `v.intersect` (e.g. `StringifyMarkdownOptionsSchema`),
 * TS uses this named reference instead of expanding the structural form,
 * which would otherwise reach `typeof h` from `hastscript` and force the
 * inferred top-level type to leak `hastscript/lib/core.js`'s `HProperties`
 * and `HChild` (TS2883). The schema below carries an explicit
 * `v.GenericSchema<ReplaceRule>` annotation, which TS verifies at compile
 * time, so the schema and the type cannot drift apart silently.
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
