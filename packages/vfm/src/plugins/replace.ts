import findAndReplace from 'hast-util-find-and-replace';
import { h } from 'hastscript';
import type { Node } from 'unist';
import * as v from 'valibot';

type H = typeof h;

export const ReplaceRuleSchema = v.object({
  test: v.instance(RegExp),
  match: v.pipe(
    v.function() as v.GenericSchema<
      (result: RegExpMatchArray, h: H) => Node | string
    >,
    v.metadata({
      typeString:
        '(result: RegExpMatchArray, h: typeof import("hastscript").h) => import("unist").Node | string',
    }),
  ),
});

export type ReplaceRule = v.InferInput<typeof ReplaceRuleSchema>;

export const ReplaceOptionsSchema = v.object({
  replace: v.optional(v.array(ReplaceRuleSchema)),
});

export type ReplaceOptions = v.InferInput<typeof ReplaceOptionsSchema>;

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
