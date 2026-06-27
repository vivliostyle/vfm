/**
 * Pandoc-style endnote rewriter.
 *
 * Picks up the default endnote markup that mdast-util-to-hast emits
 * (`<div class="footnotes">`, `<sup id="fnref-...">`, `<li id="fn-...">`)
 * and rewrites it into a `<section role="doc-endnotes">` block, applying
 * duplicate-reference handling and refIndex renumbering driven by the
 * call sites' document order.
 *
 * This style is named "pandoc" because the original implementation
 * (commit 146abea) was described as Pandoc-like. The closest versions
 * are 2.7 and 2.8-2.13 (which added the variant selector U+FE0E to
 * the backlink U+21A9). No Pandoc version is an exact match (checked
 * up to 3.9.0, the latest release as of 2026-03). Endnote body text
 * here is not wrapped in <p>.
 *
 *   $ printf 'Text[^1].\n\n[^1]: Footnote.' | docker run --rm -i pandoc/core:2.7 -f markdown -t html
 *   <p>Text<a href="#fn1" class="footnote-ref" id="fnref1" role="doc-noteref"><sup>1</sup></a>.</p>
 *   <section class="footnotes" role="doc-endnotes">
 *   <hr />
 *   <ol>
 *   <li id="fn1" role="doc-endnote"><p>Footnote.<a href="#fnref1" class="footnote-back" role="doc-backlink">↩</a></p></li>
 *   </ol>
 *   </section>
 *
 * Duplicate references to the same endnote definition are handled
 * differently from both Pandoc and GFM (tested via remark-gfm@4.0.1,
 * the latest as of 2026-03), though closer to the latter.
 */

import type * as hast from 'hast';
import { selectAll } from 'hast-util-select';
import { h } from 'hastscript';
import type unified from 'unified';
import type * as unist from 'unist';
import { u } from 'unist-builder';
import * as v from 'valibot';

type ElementWithProps = hast.Element & {
  properties: NonNullable<hast.Element['properties']>;
};

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L55-L66
 */
const endnoteAreaSelector = 'div.footnotes';
type EndnoteArea = hast.Element & {
  tagName: 'div';
  properties: { className: ['footnotes'] };
};
const selectEndnoteAreas = (tree: hast.Root) =>
  selectAll(endnoteAreaSelector, tree) as EndnoteArea[];

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L43-L48
 */
const endnoteElementSelector = `${endnoteAreaSelector} ol li[id^="fn-"]`;
type EndnoteElement = hast.Element & {
  tagName: 'li';
  properties: { id: `fn-${string}` };
};
const selectEndnoteElements = (tree: hast.Root) =>
  selectAll(endnoteElementSelector, tree) as EndnoteElement[];

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/handlers/footnote-reference.js#L15-L19
 */
const endnoteCallSelector =
  'sup[id^="fnref-"]:has(a:only-child[href^="#fn-"].footnote-ref)';
type EndnoteCall = hast.Element & {
  tagName: 'sup';
  properties: { id: `fnref-${string}` };
  children: [
    hast.Element & {
      tagName: 'a';
      properties: {
        href: `#${string}`;
        className: ['footnote-ref'];
      };
    },
  ];
};
const selectEndnoteCalls = (tree: hast.Root) =>
  selectAll(endnoteCallSelector, tree) as EndnoteCall[];

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L29-L34
 */
const endnoteBackReferenceSelector = 'a.footnote-backref';
type EndnoteBackReference = hast.Element & {
  tagName: 'a';
  properties: { className: ['footnote-backref'] };
};
const selectEndnoteBackReferences = (parent: hast.Element) =>
  selectAll(endnoteBackReferenceSelector, parent) as EndnoteBackReference[];

/**
 * Return a copy of `array` with only `key`'s values permuted to follow
 * `compareFn`'s sort order; every other field stays in its original
 * position.  Used to reshuffle one field across fixed slots without
 * disturbing surrounding entries.
 */
function withSortedField<T extends Record<string, unknown>, K extends keyof T>(
  array: readonly T[],
  key: K,
  compareFn: (a: T, b: T) => number,
): T[] {
  const sortedValues = array.toSorted(compareFn);
  return array.map(
    (item, i) => ({ ...item, [key]: sortedValues[i]![key] }) as T,
  );
}

/**
 * Merge multiple unified plugins into a single plugin whose transformer runs
 * each of the underlying transformers in order. Zero plugins yields a no-op.
 */
const mergePlugins = (...plugins: unified.Plugin[]): unified.Plugin =>
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

/**
 * Create paired Pandoc transformer plugins that share duplicate-reference
 * state.  The first plugin rewrites endnote calls; the second rewrites
 * endnote areas and adds extra backlinks for duplicate references.
 */
const createPandocTransformers = () => {
  // Shared between the two plugins: how many duplicate calls each
  // refIndex has.  Populated by the calls transformer, read by the
  // areas transformer.
  const dupCountByRefIndex = new Map<number, number>();
  // identifier to refIndex, established by the calls transformer from
  // document-order of references.  The areas transformer uses this to
  // rebind endnote bodies regardless of the order mdast-util-to-hast
  // emitted them (issue #129: table cells are walked in reverse by
  // mdast-util-to-hast <12.1.1, producing a reversed endnote list).
  const identifierToRefIndex = new Map<string, number>();

  const endnoteCallsToPandoc = () => (tree: unist.Node) => {
    // Reset closure-level maps so each document processed by a shared
    // processor instance starts from a clean slate.
    identifierToRefIndex.clear();
    dupCountByRefIndex.clear();

    const calls = selectEndnoteCalls(tree as hast.Root);

    // Build a stable mapping from definition identifier to endnote number.
    // Duplicate references to the same definition reuse that number.
    const dupCount = new Map<string, number>();
    let counter = 0;

    calls.forEach((call) => {
      const sup: ElementWithProps = call;
      const [anchor]: [ElementWithProps] = call.children;

      const href = String(anchor.properties.href);
      const identifier = href.replace(/^#fn-/, '');

      let refIndex = identifierToRefIndex.get(identifier);
      let callId: string;

      if (refIndex === undefined) {
        refIndex = ++counter;
        identifierToRefIndex.set(identifier, refIndex);
        callId = `fnref${refIndex}`;
      } else {
        const dup = (dupCount.get(identifier) ?? 0) + 1;
        dupCount.set(identifier, dup);
        dupCountByRefIndex.set(refIndex, dup);
        callId = `fnref${refIndex}-${dup}`;
      }

      // Mutate sup into <a class="footnote-ref">
      sup.tagName = 'a';
      sup.properties = {
        id: callId,
        href: `#fn${refIndex}`,
        className: ['footnote-ref'],
        role: 'doc-noteref',
      };

      // Mutate anchor into <sup>N</sup>
      anchor.tagName = 'sup';
      anchor.properties = {};
      anchor.children = [u('text', `${refIndex}`)];
    });
  };

  const endnoteAreasToPandoc = () => (tree: unist.Node) => {
    const root = tree as hast.Root;

    // must be called before mutating area.tagName
    const endnoteElements = selectEndnoteElements(root);

    selectEndnoteAreas(root).forEach((area: ElementWithProps) => {
      area.tagName = 'section';
      area.properties.role = 'doc-endnotes';
    });

    // Resolve each endnote element's true refIndex from the identifier
    // assigned during the calls pass, then relabel and reorder by refIndex.
    // When the upstream emitter is already fixed, this pass is idempotent
    // (the order and ids converge to the same values either way).
    const resolved = endnoteElements
      .map((elem: ElementWithProps) => {
        const originalId = String(elem.properties.id ?? '');
        const identifier = originalId.replace(/^fn-/, '');
        const refIndex = identifierToRefIndex.get(identifier);
        return { elem, refIndex };
      })
      .filter(
        (x): x is { elem: ElementWithProps; refIndex: number } =>
          x.refIndex !== undefined,
      );

    resolved.forEach(({ elem, refIndex }) => {
      elem.properties.id = `fn${refIndex}`;
      elem.properties.role = 'doc-endnote';

      // Back reference is expected to be placed at the end of contents
      // @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L41
      selectEndnoteBackReferences(elem).forEach((backref: ElementWithProps) => {
        backref.properties.href = `#fnref${refIndex}`;
        backref.properties.className = ['footnote-back'];
        backref.properties.role = 'doc-backlink';
      });

      // Add extra backlinks for duplicate references
      const dups = dupCountByRefIndex.get(refIndex);
      if (dups) {
        for (let d = 1; d <= dups; d++) {
          elem.children.push(
            h(
              'a',
              {
                href: `#fnref${refIndex}-${d}`,
                className: ['footnote-back'],
                role: 'doc-backlink',
              },
              '↩',
            ),
          );
        }
      }
    });

    // Reorder <li> within each <ol> to match refIndex ascending so the
    // rendered list counter matches the id.  Non-<li> siblings keep their
    // relative positions among <li> slots.
    const refIndexByElem = new Map<hast.Element, number>(
      resolved.map((r) => [r.elem, r.refIndex]),
    );
    selectAll('section[role="doc-endnotes"] ol', root).forEach((ol) => {
      withSortedField(
        ol.children.flatMap((child, i) =>
          child.type === 'element' &&
          child.tagName === 'li' &&
          refIndexByElem.has(child)
            ? [
                {
                  li: child,
                  fn: (li: hast.Element) => {
                    ol.children[i] = li;
                  },
                },
              ]
            : [],
        ),
        'li',
        ({ li: a }, { li: b }) =>
          (refIndexByElem.get(a) ?? 0) - (refIndexByElem.get(b) ?? 0),
      ).forEach(({ fn, li }) => {
        fn(li);
      });
    });
  };

  return [endnoteCallsToPandoc, endnoteAreasToPandoc] as const;
};

/**
 * Schema for Pandoc footnote options. Pandoc has no per-mode customizers,
 * so the schema only carries the discriminator. Exported for symmetry with
 * the DPUB and GCPM schemas, allowing VFM to compose a `v.variant('mode', ...)`
 * over all three modes uniformly.
 */
export const PandocFootnoteOptionsSchema = v.object({
  mode: v.literal('pandoc'),
});

export type PandocFootnoteOptions = v.InferInput<
  typeof PandocFootnoteOptionsSchema
>;

/**
 * Handlers/transformers returned by `createPandocFootnotePlugin`. The
 * `toHastHandlers` are all `undefined` so the consumer can spread them
 * into remark-rehype's `handlers` option without overriding the default
 * mdast-util-to-hast handlers (which produce the endnote markup this
 * transformer rewrites).
 */
export type PandocFootnotePlugin = {
  toHastHandlers: {
    footnoteDefinition: undefined;
    footnoteReference: undefined;
    footnote: undefined;
  };
  hastTransformer: unified.Plugin;
};

export const createPandocFootnotePlugin = (): PandocFootnotePlugin => {
  const [endnoteCallsToPandoc, endnoteAreasToPandoc] =
    createPandocTransformers();
  return {
    toHastHandlers: {
      footnoteDefinition: undefined,
      footnoteReference: undefined,
      footnote: undefined,
    },
    hastTransformer: mergePlugins(endnoteCallsToPandoc, endnoteAreasToPandoc),
  };
};
