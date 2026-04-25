import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type unified from 'unified';
import { visit } from 'unist-util-visit';
import { describe, expect, test } from 'vitest';
import { VFM, type Plugins } from '../src/index.js';

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
    let received: Plugins | undefined;

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
    // Confirm the figure plugin (slot index 1 in hastPlugins) wraps lone images
    // by default…
    const withDefault = String(
      VFM(baseOptions).processSync('![alt](pic.png)\n'),
    );
    expect(withDefault).toContain('<figure>');

    // …and is gone when removed via editPlugins.
    const withoutFigure = String(
      VFM({
        ...baseOptions,
        editPlugins: (plugins) => ({
          ...plugins,
          hastPlugins: plugins.hastPlugins.filter((_, i) => i !== 1),
        }),
      }).processSync('![alt](pic.png)\n'),
    );
    expect(withoutFigure).not.toContain('<figure>');
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

  test('plugin injected between figure and footnote sees post-figure tree', () => {
    const observe =
      (record: { sawFigure: boolean }): unified.Plugin =>
      () =>
      (tree) => {
        visit(tree as hast.Root, 'element', (node) => {
          if (node.tagName === 'figure') record.sawFigure = true;
        });
      };

    const beforeFigure = { sawFigure: false };
    const afterFigure = { sawFigure: false };

    String(
      VFM({
        ...baseOptions,
        editPlugins: ({ mdastPlugins, mdastToHastHandlers, hastPlugins }) => {
          // Tuple destructure binds each slot by its brand type, letting
          // the editor splice between specific plugins without index
          // arithmetic.
          const [raw, figure, footnote, ...rest] = hastPlugins;
          return {
            mdastPlugins,
            mdastToHastHandlers,
            hastPlugins: [
              raw,
              observe(beforeFigure),
              figure,
              observe(afterFigure),
              footnote,
              ...rest,
            ],
          };
        },
      }).processSync('![alt](pic.png)\n'),
    );

    // figure plugin wraps lone images in <figure>; observers placed before and
    // after it disagree on whether the wrapper is visible.
    expect(beforeFigure.sawFigure).toBe(false);
    expect(afterFigure.sawFigure).toBe(true);
  });
});
