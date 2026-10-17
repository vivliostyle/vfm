/**
 * Pandoc-style endnote plugin.
 *
 * Emits `<a class="footnote-ref" role="doc-noteref">` calls from the
 * `footnoteReference` handler and collects the note bodies. The hast
 * transformer then appends a `<section role="doc-endnotes">` block in
 * call order, with one extra backlink per duplicate reference.
 *
 * Until `mdast-util-to-hast` 10 the plugin rewrote the default endnote
 * footer instead. Version 13 changed every selected part of that footer
 * (`<section data-footnotes>`, `user-content-` ids, `<p>` wrapping), so the
 * structure is now produced directly and no longer depends on the upstream
 * markup.
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
import { h } from 'hastscript';
import type { FootnoteDefinition } from 'mdast';
import type { Handler, State } from 'mdast-util-to-hast';
import type { Plugin } from 'unified';
import type * as unist from 'unist';
import * as v from 'valibot';

/** Note bodies and reference counts collected while converting one document. */
type Collected = {
  /** Definition keys (`identifier.toUpperCase()`) in first-reference order. */
  order: string[];
  /** Number of references seen per definition key. */
  counts: Map<string, number>;
  /** Note body content per definition key. */
  bodies: Map<string, hast.ElementContent[]>;
};

const createCollected = (): Collected => ({
  order: [],
  counts: new Map(),
  bodies: new Map(),
});

/**
 * Unwrap a single-paragraph definition so the note body is inline content
 * (matches the tight list-item behavior of the former endnote footer).
 */
const noteBody = (
  state: State,
  def: FootnoteDefinition,
): hast.ElementContent[] =>
  state.all(
    def.children.length === 1 && def.children[0]?.type === 'paragraph'
      ? def.children[0]
      : def,
  );

const buildCall = (refIndex: number, count: number): hast.Element =>
  h(
    'a',
    {
      id: count === 1 ? `fnref${refIndex}` : `fnref${refIndex}-${count - 1}`,
      href: `#fn${refIndex}`,
      className: ['footnote-ref'],
      role: 'doc-noteref',
    },
    [h('sup', {}, String(refIndex))],
  );

const buildBacklink = (href: string): hast.Element =>
  h('a', { href, className: ['footnote-back'], role: 'doc-backlink' }, '↩');

/**
 * Register a reference to `key` and return the call element.
 * Assigns the next endnote number on first reference and reuses it after.
 */
const reference = (
  collected: Collected,
  key: string,
  body: () => hast.ElementContent[],
): hast.Element => {
  let refIndex = collected.order.indexOf(key) + 1;
  if (refIndex === 0) {
    collected.order.push(key);
    refIndex = collected.order.length;
    collected.bodies.set(key, body());
  }
  const count = (collected.counts.get(key) ?? 0) + 1;
  collected.counts.set(key, count);
  return buildCall(refIndex, count);
};

const createFootnoteReferenceHandler =
  (collected: Collected): Handler =>
  (state, node) => {
    const key = String(node.identifier).toUpperCase();
    const def = state.footnoteById.get(key);
    if (!def) {
      return undefined;
    }
    const call = reference(collected, key, () => noteBody(state, def));
    state.patch(node, call);
    return call;
  };

/**
 * Inline note (`^[...]`). The node is produced by the VFM inline-note
 * extension; a synthetic definition is registered so the note takes part in
 * the same numbering as reference footnotes.
 */
const createInlineFootnoteHandler =
  (collected: Collected): Handler =>
  (state, node) => {
    let no = 1;
    while (state.footnoteById.has(String(no))) {
      no++;
    }
    const identifier = String(no);
    const def: FootnoteDefinition = {
      type: 'footnoteDefinition',
      identifier,
      children: [{ type: 'paragraph', children: node.children }],
      position: node.position,
    };
    state.footnoteById.set(identifier, def);
    const call = reference(collected, identifier, () => state.all(node));
    state.patch(node, call);
    return call;
  };

/**
 * Append the endnote section and reset the collected state so a shared
 * processor instance starts each document from a clean slate.
 */
const createEndnoteAreaTransformer =
  (collected: Collected): Plugin =>
  () =>
  (tree: unist.Node) => {
    const root = tree as hast.Root;
    if (collected.order.length > 0) {
      const items = collected.order.map((key, i) => {
        const refIndex = i + 1;
        const count = collected.counts.get(key) ?? 1;
        const backlinks = [buildBacklink(`#fnref${refIndex}`)];
        for (let d = 1; d < count; d++) {
          backlinks.push(buildBacklink(`#fnref${refIndex}-${d}`));
        }
        return h('li', { id: `fn${refIndex}`, role: 'doc-endnote' }, [
          ...(collected.bodies.get(key) ?? []),
          ...backlinks,
        ]);
      });
      root.children.push(
        h('section', { className: ['footnotes'], role: 'doc-endnotes' }, [
          h('hr'),
          h('ol', {}, items),
        ]),
      );
    }
    collected.order.length = 0;
    collected.counts.clear();
    collected.bodies.clear();
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
 * Handlers/transformers returned by `createPandocFootnotePlugin`.
 * `footnoteDefinition` stays `undefined` so the default handler keeps
 * dropping definitions from the flow; the bodies are emitted by the
 * transformer instead.
 */
export type PandocFootnotePlugin = {
  toHastHandlers: {
    footnoteDefinition: undefined;
    footnoteReference: Handler;
    footnote: Handler;
  };
  hastTransformer: Plugin;
};

export const createPandocFootnotePlugin = (): PandocFootnotePlugin => {
  const collected = createCollected();
  return {
    toHastHandlers: {
      footnoteDefinition: undefined,
      footnoteReference: createFootnoteReferenceHandler(collected),
      footnote: createInlineFootnoteHandler(collected),
    },
    hastTransformer: createEndnoteAreaTransformer(collected),
  };
};
