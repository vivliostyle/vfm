import { describe, expect, test } from 'vitest';
import type * as unist from 'unist';
import * as v from 'valibot';
import {
  RewriteExtensionOptionsSchema,
  rewriteExtension,
} from '../src/index.js';
import { hrefRules, leaveUnchanged, markdownToHtml } from './utils.js';

describe('RewriteExtensionOptionsSchema', () => {
  test('accepts an extension converter', () => {
    expect(
      v.parse(RewriteExtensionOptionsSchema, {
        rules: hrefRules(markdownToHtml),
      }),
    ).toEqual({ rules: hrefRules(markdownToHtml) });
  });

  test('requires rules', () => {
    expect(() => v.parse(RewriteExtensionOptionsSchema, {})).toThrow();
  });
});

describe('rewriteExtension plugin shape', () => {
  test('always returns a transformer function (enabled)', () => {
    expect(
      typeof rewriteExtension({
        rules: hrefRules(markdownToHtml),
      }),
    ).toBe('function');
  });

  test('returns a transformer function for a converter that always returns null', () => {
    expect(
      typeof rewriteExtension({
        rules: hrefRules(leaveUnchanged),
      }),
    ).toBe('function');
  });

  test('transformer is a no-op when the converter returns null', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: './sibling.md' },
          children: [{ type: 'text', value: 'link' }],
        },
      ],
    } as unist.Node;
    rewriteExtension({
      rules: hrefRules(leaveUnchanged),
    })(tree);
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: './sibling.md' },
          children: [{ type: 'text', value: 'link' }],
        },
      ],
    });
  });
});
