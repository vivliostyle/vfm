import type { Nodes, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { expect, test } from 'vitest';
import { VFM } from '../src/index.js';

// Replaces the remark 8 `defs.test.ts`, which inspected
// `Parser.prototype.inlineMethods` to check that the VFM tokenizers were
// registered. remark-parse 11 has no such list: the syntaxes are micromark
// extensions, so the observable contract is that a processor built with the
// default plugins turns every VFM syntax into its mdast node.

const source = `---
title: T
---
# Heading {#id .cls}

| a | b |
| - | - |
| 1 | 2 |

{漢字|かんじ} $x = y$ $$a$$ note^[inline] ref[^1] ~~del~~ **b**{.x}

[[toc]]

[^1]: definition
`;

/**
 * Parse Markdown with the default VFM plugins (no transformers).
 * @param options - VFM options.
 * @returns mdast root.
 */
const parse = (options: { math?: boolean } = {}): Root =>
  VFM({ partial: true, ...options })
    .freeze()
    .parse(source) as Root;

/**
 * Collect the node types of a tree.
 * @param tree - mdast tree.
 * @returns Node types.
 */
const typesOf = (tree: Nodes): string[] => {
  const types = new Set<string>();
  visit(tree, (node) => {
    types.add(node.type);
  });
  return [...types];
};

test('the default processor parses every VFM syntax into its node', () => {
  expect(typesOf(parse({ math: true }))).toEqual(
    expect.arrayContaining([
      // remark-frontmatter
      'yaml',
      // remark-gfm
      'table',
      'footnoteReference',
      'footnoteDefinition',
      'delete',
      // VFM
      'ruby',
      'inlineMath',
      'displayMath',
      'footnote',
      'shortcode',
    ]),
  );
});

test('attributes are attached as hProperties', () => {
  const tree = parse();
  const heading = tree.children.find((node) => node.type === 'heading');
  expect(heading?.data?.hProperties).toStrictEqual({ id: 'id', class: 'cls' });
  const strong: Nodes[] = [];
  visit(tree, 'strong', (node) => {
    strong.push(node);
  });
  expect(strong).toHaveLength(1);
  expect(strong[0]?.data?.hProperties).toStrictEqual({ class: 'x' });
});

test('math nodes are not produced when math is off', () => {
  const types = typesOf(parse({ math: false }));
  expect(types).not.toContain('inlineMath');
  expect(types).not.toContain('displayMath');
  expect(types).toContain('ruby');
});
