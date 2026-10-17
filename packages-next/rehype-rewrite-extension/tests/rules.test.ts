import { describe, expect, test } from 'vitest';
import type * as unist from 'unist';
import {
  rewriteExtension,
  type RewriteExtensionOptions,
} from '../src/index.js';
import { markdownToHtml } from './utils.js';

type ElementTree = {
  type: 'root';
  children: [
    {
      type: 'element';
      tagName: string;
      properties: { href: string };
      children: [];
    },
  ];
};

const treeWithTagHref = (tagName: string, href: string): ElementTree => ({
  type: 'root',
  children: [
    {
      type: 'element',
      tagName,
      properties: { href },
      children: [],
    },
  ],
});

const runElementRewrite = (
  tagName: string,
  href: string,
  rules: RewriteExtensionOptions['rules'],
): string => {
  const tree = treeWithTagHref(tagName, href);
  rewriteExtension({
    rules,
  })(tree as unknown as unist.Node);
  return tree.children[0].properties.href;
};

describe('rewriteExtension: rules', () => {
  test('rewrites an element matched by a selector', () => {
    expect(
      runElementRewrite('a', './x.md', [
        {
          selector: 'a[href]',
          property: 'href',
          resolver: markdownToHtml,
        },
      ]),
    ).toBe('./x.html');
  });

  test('rewrites elements matched by any selector', () => {
    const rules = [
      { selector: 'a[href]', property: 'href', resolver: markdownToHtml },
      { selector: 'area[href]', property: 'href', resolver: markdownToHtml },
    ];
    expect(runElementRewrite('a', './x.md', rules)).toBe('./x.html');
    expect(runElementRewrite('area', './x.md', rules)).toBe('./x.html');
  });

  test('leaves an unmatched element unchanged', () => {
    expect(
      runElementRewrite('area', './x.md', [
        {
          selector: 'a[href]',
          property: 'href',
          resolver: markdownToHtml,
        },
      ]),
    ).toBe('./x.md');
  });

  test('leaves the tree unchanged when rules is empty', () => {
    expect(runElementRewrite('a', './x.md', [])).toBe('./x.md');
  });

  test('uses the property and resolver configured for each selector', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: './chapter.md' },
          children: [],
        },
        {
          type: 'element',
          tagName: 'img',
          properties: { src: './image.svg' },
          children: [],
        },
      ],
    };
    rewriteExtension({
      rules: [
        {
          selector: 'a[href]',
          property: 'href',
          resolver: markdownToHtml,
        },
        {
          selector: 'img[src]',
          property: 'src',
          resolver: ({ extension }) => (extension === 'svg' ? 'png' : null),
        },
      ],
    })(tree as unknown as unist.Node);
    expect(tree.children[0]!.properties.href).toBe('./chapter.html');
    expect(tree.children[1]!.properties.src).toBe('./image.png');
  });

  test('rewrites matching elements nested inside other elements', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'a',
              properties: { href: './nested.md' },
              children: [],
            },
          ],
        },
      ],
    };
    rewriteExtension({
      rules: [
        {
          selector: 'a[href]',
          property: 'href',
          resolver: markdownToHtml,
        },
      ],
    })(tree as unknown as unist.Node);
    expect(tree.children[0]!.children[0]!.properties.href).toBe(
      './nested.html',
    );
  });
});
