import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type unified from 'unified';
import { visit } from 'unist-util-visit';
import { describe, expect, test } from 'vitest';
import { VFM, type BuiltinPlugins } from '../src/index.js';

const baseOptions = { partial: true, disableFormatHtml: true } as const;

describe('editPlugins', () => {
  test('default (no editPlugins) and identity transform produce identical output', () => {
    const fromDefault = String(
      VFM(baseOptions).processSync('# heading\n\ntext'),
    );
    const fromIdentity = String(
      VFM({ ...baseOptions, editPlugins: (plugins) => plugins }).processSync(
        '# heading\n\ntext',
      ),
    );

    expect(fromIdentity).toBe(fromDefault);
  });

  test('exposes mdastPlugins, mdastToHastHandlers, hastPlugins to the editor', () => {
    let received: BuiltinPlugins | undefined;

    VFM({
      ...baseOptions,
      editPlugins: (plugins) => {
        received = plugins;
        return plugins;
      },
    }).processSync('text');

    expect(received).toBeDefined();
    expect(Array.isArray(received!.mdastPlugins)).toBe(true);
    expect(received!.mdastPlugins.length).toBeGreaterThan(0);
    expect(Array.isArray(received!.hastPlugins)).toBe(true);
    expect(received!.hastPlugins.length).toBeGreaterThan(0);
    expect(typeof received!.mdastToHastHandlers).toBe('object');
  });

  test('appended hast plugin runs and can mutate the tree', () => {
    const tagParagraphs: unified.Plugin = () => (tree) => {
      visit(tree as hast.Root, 'element', (node) => {
        if (node.tagName === 'p') {
          node.properties = { ...node.properties, 'data-edited': 'yes' };
        }
      });
    };

    const result = String(
      VFM({
        ...baseOptions,
        editPlugins: (plugins) => ({
          ...plugins,
          hastPlugins: [...plugins.hastPlugins, tagParagraphs],
        }),
      }).processSync('hello'),
    );

    expect(result).toContain('data-edited="yes"');
  });

  test('editor can drop a hast plugin entirely', () => {
    const replaceOptions = {
      ...baseOptions,
      replace: [
        {
          test: /foo/,
          match: () => 'BAR',
        },
      ],
    };

    // Confirm the replace plugin rewrites text by default...
    const withDefault = String(VFM(replaceOptions).processSync('foo\n'));
    expect(withDefault).toContain('BAR');

    // ...and is gone when removed via editPlugins. Slot order is
    // [raw, footnote, replace, doc, math, format].
    const withoutReplace = String(
      VFM({
        ...replaceOptions,
        editPlugins: (plugins) => {
          const [raw, footnote /* replace */, , ...rest] = plugins.hastPlugins;
          return { ...plugins, hastPlugins: [raw, footnote, ...rest] };
        },
      }).processSync('foo\n'),
    );
    expect(withoutReplace).not.toContain('BAR');
  });

  test('editor can prepend an mdast plugin that observes parsed nodes', () => {
    const headings: string[] = [];
    const captureHeadings: unified.Plugin = () => (tree) => {
      visit(tree as mdast.Root, 'heading', (node) => {
        const text = node.children
          .map((c) => ('value' in c ? c.value : ''))
          .join('');
        headings.push(text);
      });
    };

    VFM({
      ...baseOptions,
      editPlugins: ({ mdastPlugins, mdastToHastHandlers, hastPlugins }) => ({
        mdastPlugins: [captureHeadings, ...mdastPlugins],
        mdastToHastHandlers,
        hastPlugins,
      }),
    }).processSync('# alpha\n\n## beta\n\nbody');

    expect(headings).toEqual(['alpha', 'beta']);
  });

  test('plugin injected around replace sees pre/post-replacement tree', () => {
    const observe =
      (record: { sawReplaced: boolean }): unified.Plugin =>
      () =>
      (tree) => {
        visit(tree as hast.Root, 'text', (node) => {
          if (node.value.includes('BAR')) record.sawReplaced = true;
        });
      };

    const beforeReplace = { sawReplaced: false };
    const afterReplace = { sawReplaced: false };

    String(
      VFM({
        ...baseOptions,
        replace: [
          {
            test: /foo/,
            match: () => 'BAR',
          },
        ],
        editPlugins: ({ mdastPlugins, mdastToHastHandlers, hastPlugins }) => {
          // Tuple destructure binds each slot by its brand type, letting
          // the editor splice between specific plugins without index
          // arithmetic.
          const [raw, footnote, replace, ...rest] = hastPlugins;
          return {
            mdastPlugins,
            mdastToHastHandlers,
            hastPlugins: [
              raw,
              footnote,
              observe(beforeReplace),
              replace,
              observe(afterReplace),
              ...rest,
            ],
          };
        },
      }).processSync('foo\n'),
    );

    // replace rewrites `foo` -> `BAR`; observers placed before and after it
    // disagree on whether the replacement is visible.
    expect(beforeReplace.sawReplaced).toBe(false);
    expect(afterReplace.sawReplaced).toBe(true);
  });
});
