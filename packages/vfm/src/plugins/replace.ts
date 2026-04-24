import findAndReplace from 'hast-util-find-and-replace';
import { h } from 'hastscript';
import type { Node } from 'unist';

export interface ReplaceRule {
  test: RegExp;
  match: (result: RegExpMatchArray, h: any) => Node | string;
}

export type ReplaceOptions = { replaceRules?: ReplaceRule[] | undefined };

export function replace({ replaceRules: rules }: ReplaceOptions = {}) {
  if (!rules || rules.length == 0) return;
  const search = rules.map(
    (rule) =>
      [
        rule.test,
        (...result: RegExpMatchArray) => rule.match(result, h),
      ] as const,
  );
  return (tree: Node) => findAndReplace(tree, search);
}
